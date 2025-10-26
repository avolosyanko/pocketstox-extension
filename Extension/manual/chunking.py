import json
import re
import hashlib
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, asdict
import logging
from collections import defaultdict
import nltk
from nltk.tokenize import sent_tokenize
import os

# Robust NLTK data setup
def ensure_nltk_data():
    """
    Ensure NLTK required data is available.
    This handles the case where download() may have failed silently.
    """
    try:
        # Try to tokenize a test sentence to verify punkt is available
        sent_tokenize("Test sentence.")
    except LookupError:
        # If it fails, attempt download
        print("Downloading NLTK data...")
        try:
            nltk.download('punkt_tab', quiet=False)
        except Exception as e:
            print(f"⚠️ NLTK download failed: {e}")
            print("Attempting to use fallback tokenization...")
            raise

# Call this before any tokenization happens
ensure_nltk_data()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Chunk:
    """Data class for a text chunk ready for embedding"""
    chunk_id: str
    text: str
    metadata: Dict
    token_count: int
    chunk_index: int
    total_chunks: int
    content_hash: str
    
    def to_dict(self):
        return asdict(self)

class TenKChunker:
    """
    Robust chunker for 10-K sections optimized for retrieval accuracy.
    Handles both Item 1 (Business) and Item 1A (Risk Factors).
    """
    
    def __init__(self, 
                 item1_chunk_size: int = 1200,
                 item1a_chunk_size: int = 800,
                 overlap_tokens: int = 100,
                 min_chunk_size: int = 200):
        """
        Initialize chunker with configurable parameters.
        
        Args:
            item1_chunk_size: Target tokens for Item 1 chunks (business descriptions need more context)
            item1a_chunk_size: Target tokens for Item 1A chunks (risks are more atomic)
            overlap_tokens: Number of tokens to overlap between chunks
            min_chunk_size: Minimum tokens to create a chunk (filters out headers-only)
        """
        self.item1_chunk_size = item1_chunk_size
        self.item1a_chunk_size = item1a_chunk_size
        self.overlap_tokens = overlap_tokens
        self.min_chunk_size = min_chunk_size
        
        # Patterns for structure detection
        self.header_patterns = [
            re.compile(r'^[A-Z][A-Za-z\s&,]+:(?:\s|$)', re.MULTILINE),  # "Overview:", "Our Business:"
            re.compile(r'^(?:[A-Z][a-z]+\s){1,5}[A-Z][a-z]+$', re.MULTILINE),  # Title Case Headers
            re.compile(r'^[A-Z][A-Z\s&]+$', re.MULTILINE),  # "BUSINESS OVERVIEW"
            re.compile(r'^\d+\.\s+[A-Z][a-z]', re.MULTILINE),  # "1. Business Description"
        ]
        
        # Risk factor patterns for Item 1A
        self.risk_patterns = [
            re.compile(r'^(?:We|Our|The Company|If|Failure|Any|Significant|Material)\s+[\w\s]+(?:may|might|could|would|will)', re.MULTILINE),
            re.compile(r'^[•·▪]\s*(?:We|Our|The)', re.MULTILINE),  # Bullet points
            re.compile(r'^(?:Risk[s]?\s+(?:Related|Relating|Factor[s]?)|Risks?\s+(?:from|of|to))', re.MULTILINE),
        ]
        
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count (roughly 1 token per 4 chars for financial text).
        For production, replace with actual tokenizer for voyage-finance-2.
        """
        return len(text) // 4
    
    def detect_headers(self, text: str) -> List[Tuple[int, int, str]]:
        """
        Detect potential headers and their positions.
        Returns list of (start_pos, end_pos, header_text).
        """
        headers = []
        for pattern in self.header_patterns:
            for match in pattern.finditer(text):
                headers.append((match.start(), match.end(), match.group().strip()))
        
        # Sort by position
        headers.sort(key=lambda x: x[0])
        return headers
    
    def split_into_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs, handling various formatting."""
        # Normalize line breaks
        text = re.sub(r'\r\n', '\n', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Split on double newlines
        paragraphs = text.split('\n\n')
        
        # Filter out empty paragraphs and clean
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        
        return paragraphs
    
    def smart_sentence_split(self, text: str, max_tokens: int) -> List[str]:
        """
        Split a large paragraph into sentence-based chunks.
        Preserves semantic coherence by keeping related sentences together.
        """
        try:
            sentences = sent_tokenize(text)
        except LookupError as e:
            logger.warning(f"NLTK tokenizer failed: {e}. Using fallback tokenization.")
            # Fallback: simple sentence splitting on periods, question marks, exclamation marks
            sentences = re.split(r'(?<=[.!?])\s+', text)
            sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for sentence in sentences:
            sent_tokens = self.estimate_tokens(sentence)
            
            if current_size + sent_tokens > max_tokens and current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = [sentence]
                current_size = sent_tokens
            else:
                current_chunk.append(sentence)
                current_size += sent_tokens
        
        if current_chunk:
            chunks.append(' '.join(current_chunk))
        
        return chunks
    
    def create_chunks_for_section(self, 
                                  text: str, 
                                  section_type: str,
                                  company_info: Dict) -> List[Chunk]:
        """
        Create chunks for a specific section (item1 or item1a).
        """
        chunks = []
        chunk_size = self.item1_chunk_size if section_type == 'item1' else self.item1a_chunk_size
        
        # Detect structure
        headers = self.detect_headers(text)
        paragraphs = self.split_into_paragraphs(text)
        
        # Track current context
        current_header = None
        current_chunks = []
        current_text = []
        current_tokens = 0
        last_paragraph = None  # For overlap
        
        # Process paragraphs
        for i, para in enumerate(paragraphs):
            # Check if this paragraph is a header
            is_header = any(
                para.strip() == h[2] or para.strip().startswith(h[2]) 
                for h in headers
            )
            
            # For Item 1A, check if this starts a new risk
            is_new_risk = False
            if section_type == 'item1a':
                is_new_risk = any(pattern.match(para) for pattern in self.risk_patterns)
            
            # Should we start a new chunk?
            start_new_chunk = False
            
            if is_header and current_tokens > 0:
                start_new_chunk = True
                current_header = para.strip()
                continue  # Don't include standalone headers
            elif is_new_risk and current_tokens > self.min_chunk_size:
                start_new_chunk = True
            elif current_tokens + self.estimate_tokens(para) > chunk_size and current_tokens > 0:
                start_new_chunk = True
            
            if start_new_chunk:
                # Save current chunk
                chunk_text = '\n\n'.join(current_text)
                if self.estimate_tokens(chunk_text) >= self.min_chunk_size:
                    chunks.append(self._create_chunk(
                        chunk_text,
                        section_type,
                        company_info,
                        current_header,
                        len(chunks)
                    ))
                
                # Start new chunk with overlap
                current_text = []
                current_tokens = 0
                
                # Add overlap from last paragraph if it exists and isn't too large
                if last_paragraph and self.estimate_tokens(last_paragraph) < self.overlap_tokens * 2:
                    current_text.append(last_paragraph)
                    current_tokens = self.estimate_tokens(last_paragraph)
            
            # Handle oversized paragraphs
            para_tokens = self.estimate_tokens(para)
            if para_tokens > chunk_size:
                # Split into sentences
                sentence_chunks = self.smart_sentence_split(para, chunk_size)
                for sent_chunk in sentence_chunks:
                    if current_text and current_tokens + self.estimate_tokens(sent_chunk) > chunk_size:
                        # Save current and start new
                        chunk_text = '\n\n'.join(current_text)
                        if self.estimate_tokens(chunk_text) >= self.min_chunk_size:
                            chunks.append(self._create_chunk(
                                chunk_text,
                                section_type,
                                company_info,
                                current_header,
                                len(chunks)
                            ))
                        current_text = [sent_chunk]
                        current_tokens = self.estimate_tokens(sent_chunk)
                    else:
                        current_text.append(sent_chunk)
                        current_tokens += self.estimate_tokens(sent_chunk)
            else:
                # Add normal paragraph
                current_text.append(para)
                current_tokens += para_tokens
            
            last_paragraph = para
        
        # Don't forget the last chunk
        if current_text:
            chunk_text = '\n\n'.join(current_text)
            if self.estimate_tokens(chunk_text) >= self.min_chunk_size:
                chunks.append(self._create_chunk(
                    chunk_text,
                    section_type,
                    company_info,
                    current_header,
                    len(chunks)
                ))
        
        # Update total chunks count
        total_chunks = len(chunks)
        for chunk in chunks:
            chunk.total_chunks = total_chunks
        
        return chunks
    
    def _create_chunk(self, 
                     text: str, 
                     section_type: str,
                     company_info: Dict,
                     header: Optional[str],
                     index: int) -> Chunk:
        """Create a single chunk with metadata."""
        # Generate unique ID
        chunk_id = f"{company_info['ticker']}_{section_type}_{company_info['fiscal_year']}_chunk_{index}"
        
        # Create content hash for deduplication
        normalized_text = re.sub(r'\s+', ' ', text.lower().strip())
        content_hash = hashlib.md5(normalized_text.encode()).hexdigest()[:16]
        
        # Build metadata
        metadata = {
            'company_name': company_info['company_name'],
            'ticker': company_info['ticker'],
            'cik': company_info['cik'],
            'section': section_type,
            'subsection': header,
            'filing_date': company_info['filing_date'],
            'fiscal_year': company_info['fiscal_year'],
            'form_type': company_info['form_type'],
            'industry': company_info.get('industry', 'Unknown'),
            'sic_code': company_info.get('sic_code', 'Unknown')
        }
        
        # Add section-specific metadata
        if section_type == 'item1a':
            # Classify risk type
            risk_type = self._classify_risk_type(text)
            metadata['risk_type'] = risk_type
        
        return Chunk(
            chunk_id=chunk_id,
            text=text,
            metadata=metadata,
            token_count=self.estimate_tokens(text),
            chunk_index=index,
            total_chunks=0,  # Will be updated after all chunks created
            content_hash=content_hash
        )
    
    def _classify_risk_type(self, text: str) -> str:
        """Classify risk factor into categories for better retrieval."""
        text_lower = text.lower()
        
        risk_categories = {
            'operational': ['operation', 'satellite', 'launch', 'manufacture', 'supply', 'production'],
            'financial': ['financial', 'liquidity', 'cash', 'revenue', 'profit', 'cost', 'expense'],
            'regulatory': ['regulation', 'compliance', 'legal', 'law', 'government', 'license'],
            'competitive': ['competition', 'competitor', 'market share', 'pricing'],
            'cybersecurity': ['cyber', 'security', 'breach', 'hack', 'data', 'privacy'],
            'technological': ['technology', 'obsolete', 'innovation', 'development'],
            'reputational': ['reputation', 'brand', 'public', 'media']
        }
        
        # Count category matches
        category_scores = defaultdict(int)
        for category, keywords in risk_categories.items():
            for keyword in keywords:
                category_scores[category] += text_lower.count(keyword)
        
        # Return highest scoring category
        if category_scores:
            return max(category_scores, key=category_scores.get)
        return 'general'
    
    def process_company(self, company_data: Dict) -> Dict[str, List[Chunk]]:
        """
        Process a single company's 10-K data.
        
        Args:
            company_data: Dictionary with company info and sections
        
        Returns:
            Dictionary with 'item1' and 'item1a' chunk lists
        """
        results = {}
        
        # Extract company info
        company_info = {
            'company_name': company_data['company_name'],
            'ticker': company_data['ticker'],
            'cik': company_data['cik'],
            'filing_date': company_data['filing_date'],
            'fiscal_year': company_data['fiscal_year'],
            'form_type': company_data['form_type'],
            'industry': company_data.get('industry', 'Unknown'),
            'sic_code': company_data.get('sic_code', 'Unknown')
        }
        
        # Process Item 1
        if 'item1' in company_data['sections']:
            item1_text = company_data['sections']['item1']['text']
            results['item1'] = self.create_chunks_for_section(
                item1_text, 
                'item1', 
                company_info
            )
            logger.info(f"Created {len(results['item1'])} chunks for {company_info['ticker']} Item 1")
        
        # Process Item 1A
        if 'item1a' in company_data['sections']:
            item1a_text = company_data['sections']['item1a']['text']
            results['item1a'] = self.create_chunks_for_section(
                item1a_text, 
                'item1a', 
                company_info
            )
            logger.info(f"Created {len(results['item1a'])} chunks for {company_info['ticker']} Item 1A")
        
        return results


def process_batch(json_files: List[str], 
                  output_file: str = 'chunks_for_embedding.jsonl',
                  batch_size: int = 10) -> Dict:
    """
    Process multiple company JSON files in batches.
    
    Args:
        json_files: List of paths to JSON files
        output_file: Output JSONL file for chunks
        batch_size: Number of companies to process before writing
    
    Returns:
        Statistics about the chunking process
    """
    chunker = TenKChunker()
    stats = {
        'total_companies': 0,
        'total_chunks': 0,
        'chunks_by_section': defaultdict(int),
        'errors': []
    }
    
    # Create output directory if it doesn't exist
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    with open(output_file, 'w') as out_f:
        batch_chunks = []
        
        for i, json_file in enumerate(json_files):
            try:
                # Load company data
                with open(json_file, 'r') as f:
                    company_data = json.load(f)
                
                # Process company
                chunks_by_section = chunker.process_company(company_data)
                
                # Collect chunks
                for section, chunks in chunks_by_section.items():
                    for chunk in chunks:
                        batch_chunks.append(chunk.to_dict())
                        stats['chunks_by_section'][section] += 1
                
                stats['total_companies'] += 1
                
                # Write batch to file
                if (i + 1) % batch_size == 0:
                    for chunk_dict in batch_chunks:
                        out_f.write(json.dumps(chunk_dict) + '\n')
                    stats['total_chunks'] += len(batch_chunks)
                    logger.info(f"Processed {i+1}/{len(json_files)} companies, {stats['total_chunks']} chunks")
                    batch_chunks = []
                    
            except Exception as e:
                logger.error(f"Error processing {json_file}: {str(e)}")
                stats['errors'].append({'file': json_file, 'error': str(e)})
        
        # Write remaining chunks
        if batch_chunks:
            for chunk_dict in batch_chunks:
                out_f.write(json.dumps(chunk_dict) + '\n')
            stats['total_chunks'] += len(batch_chunks)
    
    return stats


# Example usage
if __name__ == "__main__":
    import glob

    json_files = glob.glob("/Users/andres/Documents/Projects/Pocketstox/Extension/data/extracted_10k/*.json")

    if not json_files:
        print("No JSON files found in data/extract/. Check your path.")
        exit()

    print(f"Found {len(json_files)} filings to process.")

    # Define output path
    output_path = "/Users/andres/Documents/Projects/Pocketstox/Extension/data/10k_chunks.jsonl"

    # Run the batch processor
    stats = process_batch(
        json_files=json_files,
        output_file=output_path,
        batch_size=10
    )

    print("\nDone chunking all 10-Ks!")
    print(f"Companies processed: {stats['total_companies']}")
    print(f"Total chunks created: {stats['total_chunks']}")
    print("Chunks by section:", dict(stats['chunks_by_section']))
    print(f"Output saved to: {output_path}")

    if stats["errors"]:
        print("\nErrors:")
        for e in stats["errors"]:
            print(f"  - {e['file']}: {e['error']}")