"""
Pocketstox: Embed & Ingest Pipeline
Embeds 10-K chunks using Voyage Finance-2 and ingests into Qdrant Cloud.

Key features:
- Batch processing with rate limiting
- Resume capability (skips already embedded chunks)
- Cost tracking
- Proper metadata indexing
- Error handling with retries
"""

import os
import json
import time
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import voyageai
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    PayloadSchemaType, TextIndexParams, TextIndexType
)
from tqdm import tqdm
import hashlib
from pathlib import Path

from dotenv import load_dotenv
load_dotenv('../.env')  # Load from parent directory

# ========================
# CONFIGURATION
# ========================

@dataclass
class Config:
    """Pipeline configuration"""
    
    # API Keys (set as environment variables)
    VOYAGE_API_KEY: str = os.getenv("VOYAGE_API_KEY", "")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    QDRANT_URL: str = os.getenv("QDRANT_URL", "")  # e.g., https://xyz.us-east.aws.cloud.qdrant.io
    
    # Voyage settings
    VOYAGE_MODEL: str = "voyage-finance-2"
    VOYAGE_INPUT_TYPE: str = "document"  # "document" for corpus, "query" for user queries
    EMBEDDING_DIM: int = 1024  # voyage-finance-2 dimension
    BATCH_SIZE: int = 128  # Voyage supports up to 128 per batch
    
    # Qdrant settings
    COLLECTION_NAME: str = "pocketstox_10k"
    DISTANCE_METRIC: Distance = Distance.COSINE
    
    # Rate limiting (Voyage: 300 RPM, 7M TPM for Tier 1)
    REQUESTS_PER_MINUTE: int = 280  # Leave buffer
    
    # Files
    INPUT_JSONL: str = "/Users/andres/Documents/Projects/Pocketstox/Extension/data/10k_chunks.jsonl"
    CHECKPOINT_FILE: str = "/Users/andres/Documents/Projects/Pocketstox/Extension/data/embedding_checkpoint.json"
    COST_LOG_FILE: str = "/Users/andres/Documents/Projects/Pocketstox/Extension/data/embedding_costs.json"
    
    def validate(self):
        """Validate configuration"""
        if not self.VOYAGE_API_KEY:
            raise ValueError("VOYAGE_API_KEY environment variable not set")
        if not self.QDRANT_API_KEY:
            raise ValueError("QDRANT_API_KEY environment variable not set")
        if not self.QDRANT_URL:
            raise ValueError("QDRANT_URL environment variable not set")


# ========================
# CHECKPOINT MANAGER
# ========================

class CheckpointManager:
    """Manages resume capability by tracking processed chunks"""
    
    def __init__(self, checkpoint_file: str):
        self.checkpoint_file = checkpoint_file
        self.processed_ids = set()
        self._load()
    
    def _load(self):
        """Load checkpoint from disk"""
        if os.path.exists(self.checkpoint_file):
            with open(self.checkpoint_file, 'r') as f:
                data = json.load(f)
                self.processed_ids = set(data.get('processed_ids', []))
            print(f"📋 Loaded checkpoint: {len(self.processed_ids)} chunks already processed")
    
    def mark_processed(self, chunk_ids: List[str]):
        """Mark chunks as processed"""
        self.processed_ids.update(chunk_ids)
    
    def save(self):
        """Save checkpoint to disk"""
        os.makedirs(os.path.dirname(self.checkpoint_file), exist_ok=True)
        with open(self.checkpoint_file, 'w') as f:
            json.dump({
                'processed_ids': list(self.processed_ids),
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
            }, f, indent=2)
    
    def is_processed(self, chunk_id: str) -> bool:
        """Check if chunk already processed"""
        return chunk_id in self.processed_ids


# ========================
# COST TRACKER
# ========================

class CostTracker:
    """Track embedding costs"""
    
    # Voyage Finance-2 pricing: $0.12 per 1M tokens
    COST_PER_1M_TOKENS = 0.12
    
    def __init__(self, cost_log_file: str):
        self.cost_log_file = cost_log_file
        self.total_tokens = 0
        self.total_cost = 0.0
        self._load()
    
    def _load(self):
        """Load cost log from disk"""
        if os.path.exists(self.cost_log_file):
            with open(self.cost_log_file, 'r') as f:
                data = json.load(f)
                self.total_tokens = data.get('total_tokens', 0)
                self.total_cost = data.get('total_cost', 0.0)
    
    def add_usage(self, tokens: int):
        """Add token usage"""
        self.total_tokens += tokens
        self.total_cost = (self.total_tokens / 1_000_000) * self.COST_PER_1M_TOKENS
    
    def save(self):
        """Save cost log to disk"""
        os.makedirs(os.path.dirname(self.cost_log_file), exist_ok=True)
        with open(self.cost_log_file, 'w') as f:
            json.dump({
                'total_tokens': self.total_tokens,
                'total_cost': round(self.total_cost, 4),
                'cost_per_1m_tokens': self.COST_PER_1M_TOKENS,
                'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
            }, f, indent=2)
    
    def get_summary(self) -> str:
        """Get cost summary string"""
        return f"Tokens: {self.total_tokens:,} | Cost: ${self.total_cost:.4f}"


# ========================
# EMBEDDING PIPELINE
# ========================

class EmbeddingPipeline:
    """Handles batch embedding with rate limiting"""
    
    def __init__(self, config: Config):
        self.config = config
        self.voyage_client = voyageai.Client(api_key=config.VOYAGE_API_KEY)
        self.checkpoint = CheckpointManager(config.CHECKPOINT_FILE)
        self.cost_tracker = CostTracker(config.COST_LOG_FILE)
        self.request_times = []
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        now = time.time()
        # Remove requests older than 1 minute
        self.request_times = [t for t in self.request_times if now - t < 60]
        
        if len(self.request_times) >= self.config.REQUESTS_PER_MINUTE:
            sleep_time = 60 - (now - self.request_times[0])
            if sleep_time > 0:
                print(f"⏳ Rate limit: sleeping {sleep_time:.1f}s")
                time.sleep(sleep_time)
        
        self.request_times.append(time.time())
    
    def embed_batch(self, texts: List[str], retry_count: int = 3) -> Optional[List[List[float]]]:
        """
        Embed a batch of texts using Voyage AI
        
        Args:
            texts: List of text strings to embed
            retry_count: Number of retries on failure
        
        Returns:
            List of embeddings or None on failure
        """
        self._rate_limit()
        
        for attempt in range(retry_count):
            try:
                result = self.voyage_client.embed(
                    texts=texts,
                    model=self.config.VOYAGE_MODEL,
                    input_type=self.config.VOYAGE_INPUT_TYPE
                )
                
                # Track usage
                tokens_used = result.total_tokens
                self.cost_tracker.add_usage(tokens_used)
                
                return result.embeddings
                
            except Exception as e:
                if attempt < retry_count - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"⚠️  Embedding failed (attempt {attempt+1}/{retry_count}): {e}")
                    print(f"   Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    print(f"❌ Embedding failed after {retry_count} attempts: {e}")
                    return None
        
        return None


# ========================
# QDRANT MANAGER
# ========================

class QdrantManager:
    """Manages Qdrant collection and ingestion"""
    
    def __init__(self, config: Config):
        self.config = config
        self.client = QdrantClient(
            url=config.QDRANT_URL,
            api_key=config.QDRANT_API_KEY,
            timeout=60
        )
    
    def create_collection(self, recreate: bool = False):
        """
        Create Qdrant collection with optimal schema
        
        Args:
            recreate: If True, delete existing collection first
        """
        collection_name = self.config.COLLECTION_NAME
        
        # Check if collection exists
        collections = self.client.get_collections().collections
        exists = any(c.name == collection_name for c in collections)
        
        if exists and recreate:
            print(f"🗑️  Deleting existing collection: {collection_name}")
            self.client.delete_collection(collection_name)
            exists = False
        
        if not exists:
            print(f"🏗️  Creating collection: {collection_name}")
            
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=self.config.EMBEDDING_DIM,
                    distance=self.config.DISTANCE_METRIC
                )
            )
            
            # Create payload indexes for fast filtering
            # These fields will be commonly filtered on
            index_fields = [
                ('ticker', PayloadSchemaType.KEYWORD),
                ('section', PayloadSchemaType.KEYWORD),
                ('fiscal_year', PayloadSchemaType.INTEGER),
                ('industry', PayloadSchemaType.KEYWORD),
                ('sic_code', PayloadSchemaType.KEYWORD),
                ('risk_type', PayloadSchemaType.KEYWORD),  # For Item 1A
            ]
            
            for field, schema_type in index_fields:
                try:
                    self.client.create_payload_index(
                        collection_name=collection_name,
                        field_name=field,
                        field_schema=schema_type
                    )
                    print(f"   ✅ Indexed: {field}")
                except Exception as e:
                    print(f"   ⚠️  Index {field} failed: {e}")
            
            # Create full-text index on company_name for text search fallback
            self.client.create_payload_index(
                collection_name=collection_name,
                field_name='company_name',
                field_schema=PayloadSchemaType.TEXT,
                field_type=TextIndexParams(
                    type=TextIndexType.TEXT,
                    tokenizer="word",
                    min_token_len=2,
                    max_token_len=20,
                    lowercase=True
                )
            )
            print(f"   ✅ Full-text indexed: company_name")
            
            print(f"✅ Collection created with {len(index_fields) + 1} indexed fields")
        else:
            print(f"✅ Collection already exists: {collection_name}")
    
    def upsert_points(self, points: List[PointStruct], batch_size: int = 50):
        """
        Upsert points to Qdrant in batches
        
        Args:
            points: List of PointStruct objects
            batch_size: Number of points per batch
        """
        collection_name = self.config.COLLECTION_NAME
        
        for i in range(0, len(points), batch_size):
            batch = points[i:i+batch_size]
            try:
                self.client.upsert(
                    collection_name=collection_name,
                    points=batch
                )
            except Exception as e:
                print(f"❌ Upsert failed for batch {i//batch_size + 1}: {e}")
                raise


# ========================
# MAIN PIPELINE
# ========================

def load_chunks(jsonl_file: str) -> List[Dict]:
    """Load chunks from JSONL file"""
    chunks = []
    with open(jsonl_file, 'r') as f:
        for line in f:
            chunks.append(json.loads(line))
    return chunks


def chunk_to_point(chunk: Dict, embedding: List[float]) -> PointStruct:
    """
    Convert chunk + embedding to Qdrant point
    
    Args:
        chunk: Chunk dictionary from chunking pipeline
        embedding: Vector embedding
    
    Returns:
        PointStruct ready for ingestion
    """
    # Generate deterministic point ID from chunk_id
    point_id = int(hashlib.md5(chunk['chunk_id'].encode()).hexdigest(), 16) % (2**63)
    
    # Prepare payload (metadata + text)
    payload = {
        **chunk['metadata'],  # All metadata fields
        'text': chunk['text'],  # Store text for retrieval
        'chunk_id': chunk['chunk_id'],
        'token_count': chunk['token_count'],
        'chunk_index': chunk['chunk_index'],
        'total_chunks': chunk['total_chunks'],
        'content_hash': chunk['content_hash']
    }
    
    return PointStruct(
        id=point_id,
        vector=embedding,
        payload=payload
    )


def run_pipeline(
    config: Config,
    recreate_collection: bool = False,
    dry_run: bool = False
):
    """
    Main pipeline execution
    
    Args:
        config: Pipeline configuration
        recreate_collection: Whether to recreate Qdrant collection
        dry_run: If True, only estimate costs without embedding
    """
    config.validate()
    
    print("="*70)
    print("🚀 POCKETSTOX EMBEDDING & INGESTION PIPELINE")
    print("="*70)
    
    # Load chunks
    print(f"\n📂 Loading chunks from: {config.INPUT_JSONL}")
    chunks = load_chunks(config.INPUT_JSONL)
    print(f"   Loaded {len(chunks):,} chunks")
    
    # Initialize components
    embedder = EmbeddingPipeline(config)
    qdrant = QdrantManager(config)
    
    # Filter already processed chunks
    chunks_to_process = [
        c for c in chunks 
        if not embedder.checkpoint.is_processed(c['chunk_id'])
    ]
    
    if len(chunks_to_process) < len(chunks):
        print(f"   ✅ Skipping {len(chunks) - len(chunks_to_process):,} already processed chunks")
    
    print(f"   📊 Chunks to process: {len(chunks_to_process):,}")
    
    # Estimate costs
    total_tokens = sum(c['token_count'] for c in chunks_to_process)
    estimated_cost = (total_tokens / 1_000_000) * CostTracker.COST_PER_1M_TOKENS
    print(f"\n💰 Cost Estimate:")
    print(f"   Tokens: {total_tokens:,}")
    print(f"   Cost: ${estimated_cost:.4f}")
    print(f"   Batches: {len(chunks_to_process) // config.BATCH_SIZE + 1}")
    
    if dry_run:
        print("\n🔍 Dry run complete. Set dry_run=False to proceed.")
        return
    
    # Confirm
    print("\n" + "="*70)
    response = input("🚦 Proceed with embedding and ingestion? (yes/no): ")
    if response.lower() != 'yes':
        print("❌ Cancelled.")
        return
    
    # Create/verify collection
    print("\n" + "="*70)
    qdrant.create_collection(recreate=recreate_collection)
    
    # Process in batches
    print("\n" + "="*70)
    print("🔄 PROCESSING BATCHES")
    print("="*70)
    
    batch_size = config.BATCH_SIZE
    total_uploaded = 0
    
    # ✅ CRITICAL FIX: Upload batch-by-batch, not all at once!
    for i in tqdm(range(0, len(chunks_to_process), batch_size), desc="Embedding & Upload", unit="batch"):
        batch_chunks = chunks_to_process[i:i+batch_size]
        
        # Extract texts
        texts = [c['text'] for c in batch_chunks]
        
        # Embed batch
        embeddings = embedder.embed_batch(texts)
        
        if embeddings is None:
            print(f"❌ Batch {i//batch_size + 1} failed, stopping pipeline")
            break
        
        # Convert to points
        batch_points = [
            chunk_to_point(chunk, emb)
            for chunk, emb in zip(batch_chunks, embeddings)
        ]
        
        # ✅ UPSERT IMMEDIATELY (don't accumulate!)
        try:
            qdrant.upsert_points(batch_points, batch_size=50)
            total_uploaded += len(batch_points)
            
            # ✅ Only mark as processed AFTER successful upsert
            chunk_ids = [c['chunk_id'] for c in batch_chunks]
            embedder.checkpoint.mark_processed(chunk_ids)
            
        except Exception as e:
            print(f"❌ Upsert failed for batch {i//batch_size + 1}: {e}")
            print("Stopping pipeline. Re-run to resume from checkpoint.")
            break
        
        # Save checkpoint every 10 batches
        if (i // batch_size + 1) % 10 == 0:
            embedder.checkpoint.save()
            embedder.cost_tracker.save()
    
    # Final saves
    embedder.checkpoint.save()
    embedder.cost_tracker.save()
    
    # Final summary
    print("\n" + "="*70)
    print("✅ PIPELINE COMPLETE")
    print("="*70)
    print(f"Processed: {total_uploaded:,} chunks")
    print(f"Cost: {embedder.cost_tracker.get_summary()}")
    print(f"Collection: {config.COLLECTION_NAME}")
    print(f"Checkpoint: {config.CHECKPOINT_FILE}")
    print("="*70)


# ========================
# CLI
# ========================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Pocketstox Embedding & Ingestion Pipeline")
    parser.add_argument("--input", type=str, help="Input JSONL file (default: from config)")
    parser.add_argument("--recreate", action="store_true", help="Recreate Qdrant collection")
    parser.add_argument("--dry-run", action="store_true", help="Estimate costs without embedding")
    
    args = parser.parse_args()
    
    # Initialize config
    config = Config()
    if args.input:
        config.INPUT_JSONL = args.input
    
    # Run pipeline
    run_pipeline(
        config=config,
        recreate_collection=args.recreate,
        dry_run=args.dry_run
    )