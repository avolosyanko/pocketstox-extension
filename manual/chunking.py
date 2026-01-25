"""
10-K chunking script
"""

import json
import re
import glob
from pathlib import Path
from datetime import datetime
import tiktoken

SCRIPT_DIR = Path(__file__).parent
INPUT_DIR = SCRIPT_DIR / "data" / "extracted_10k"
OUTPUT_FILE = SCRIPT_DIR / "data" / "10k_chunks.jsonl"
ERROR_LOG = SCRIPT_DIR / "data" / "_chunking_errors.json"

MAX_TOKENS = 1000
OVERLAP_TOKENS = 100
MIN_PARAGRAPH_LENGTH = 50

encoding = tiktoken.get_encoding("cl100k_base") # Initialise tokeniser (Voyage Finance-2 uses cl100k_base encoding)


def count_tokens(text: str) -> int:
    """Count tokens using tiktoken"""
    return len(encoding.encode(text))


def normalize_text(text: str) -> str:
    """Normalize newlines and whitespace"""
    # Windows → Unix
    text = text.replace('\r\n', '\n')
    # Multiple newlines → double
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def split_paragraphs(text: str) -> list[str]:
    """
    Split text into paragraphs on double newlines
    Filter out very short paragraphs (headers-only)
    """
    paragraphs = text.split('\n\n')
    # Filter: keep paragraphs with at least MIN_PARAGRAPH_LENGTH chars
    paragraphs = [p.strip() for p in paragraphs if len(p.strip()) >= MIN_PARAGRAPH_LENGTH]
    return paragraphs


def create_chunks(paragraphs: list[str], 
                  max_tokens: int = MAX_TOKENS,
                  overlap_tokens: int = OVERLAP_TOKENS) -> list[str]:
    """
    Combine paragraphs into chunks until hitting token limit
    Add overlap between chunks for context continuity
    """
    chunks = []
    current_chunk = []
    current_tokens = 0
    
    for para in paragraphs:
        para_tokens = count_tokens(para)
        
        # Would adding this paragraph exceed the limit?
        if current_tokens + para_tokens > max_tokens and current_chunk:
            # Save current chunk
            chunks.append('\n\n'.join(current_chunk))
            
            # Start new chunk with overlap from last paragraph
            overlap_text = current_chunk[-1]
            overlap_size = count_tokens(overlap_text)
            
            if overlap_size < overlap_tokens:
                # Use last paragraph as overlap
                current_chunk = [overlap_text, para]
                current_tokens = overlap_size + para_tokens
            else:
                # Last paragraph too big for overlap, start fresh
                current_chunk = [para]
                current_tokens = para_tokens
        else:
            # Add paragraph to current chunk
            current_chunk.append(para)
            current_tokens += para_tokens
    
    # Don't forget the last chunk
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    return chunks


def create_chunk_dict(chunk_text: str,
                     company_data: dict,
                     section: str,
                     chunk_index: int,
                     total_chunks: int) -> dict:
    """Package chunk with metadata"""
    return {
        'chunk_id': f"{company_data['ticker']}_{section}_{company_data['fiscal_year']}_chunk_{chunk_index}",
        'text': chunk_text,
        'ticker': company_data['ticker'],
        'company_name': company_data['company_name'],
        'cik': company_data['cik'],
        'section': section,
        'filing_date': company_data['filing_date'],
        'fiscal_year': company_data['fiscal_year'],
        'source_url': company_data['source_url'],
        'chunk_index': chunk_index,
        'total_chunks': total_chunks,
        'token_count': count_tokens(chunk_text)
    }


def process_company(data: dict) -> dict:
    """
    Process a single company's 10-K data
    Returns dict with chunk counts and any errors
    """
    result = {
        'ticker': data['ticker'],
        'item1_chunks': 0,
        'item1a_chunks': 0,
        'errors': []
    }
    
    chunks_created = []
    
    # Process Item 1 (Business)
    if data['sections']['item1']['text']:
        try:
            item1_text = normalize_text(data['sections']['item1']['text'])
            paragraphs = split_paragraphs(item1_text)
            chunks = create_chunks(paragraphs)
            
            for i, chunk in enumerate(chunks):
                chunk_dict = create_chunk_dict(
                    chunk, data, 'item1', i, len(chunks)
                )
                chunks_created.append(chunk_dict)
            
            result['item1_chunks'] = len(chunks)
        except Exception as e:
            result['errors'].append(f"Item 1 error: {str(e)}")
    
    # Process Item 1A (Risk Factors)
    if data['sections']['item1a']['text']:
        try:
            item1a_text = normalize_text(data['sections']['item1a']['text'])
            paragraphs = split_paragraphs(item1a_text)
            chunks = create_chunks(paragraphs)
            
            for i, chunk in enumerate(chunks):
                chunk_dict = create_chunk_dict(
                    chunk, data, 'item1a', i, len(chunks)
                )
                chunks_created.append(chunk_dict)
            
            result['item1a_chunks'] = len(chunks)
        except Exception as e:
            result['errors'].append(f"Item 1A error: {str(e)}")
    
    result['chunks'] = chunks_created
    return result


def process_all_files():
    json_files = sorted(glob.glob(str(INPUT_DIR / "*.json")))
    
    if not json_files:
        print(f"No JSON files found in {INPUT_DIR}.")
        return
    
    print(f"Found {len(json_files)} files to process")
    print(f"Output: {OUTPUT_FILE}\n")
    
    # Create output directory if needed
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    total_chunks = 0
    successful = 0
    errors = []
    
    with open(OUTPUT_FILE, 'w') as f:
        for i, json_file in enumerate(json_files, 1):
            try:
                # Load company data
                with open(json_file, 'r') as jf:
                    data = json.load(jf)
                
                # Process company
                result = process_company(data)
                
                # Write chunks to JSONL
                for chunk in result['chunks']:
                    f.write(json.dumps(chunk) + '\n')
                    total_chunks += 1
                
                # Track results
                chunk_count = result['item1_chunks'] + result['item1a_chunks']
                print(f"[{i}/{len(json_files)}] {data['ticker']}: {chunk_count} chunks")
                
                if result['errors']:
                    errors.append({
                        'ticker': data['ticker'],
                        'file': json_file,
                        'errors': result['errors']
                    })
                else:
                    successful += 1
                    
            except Exception as e:
                print(f"[{i}/{len(json_files)}] {Path(json_file).stem}: FAILED - {str(e)}")
                errors.append({
                    'file': json_file,
                    'error': str(e)
                })
    
    # Print summary
    print(f"\n{'='*60}")
    print("CHUNKING COMPLETE")
    print(f"{'='*60}")
    print(f"Successful: {successful}/{len(json_files)}")
    print(f"Total chunks: {total_chunks}")
    print(f"Failed: {len(errors)}")
    print(f"\nOutput: {OUTPUT_FILE}")
    
    # Save error log if any errors
    if errors:
        with open(ERROR_LOG, 'w') as f:
            json.dump(errors, f, indent=2)
        print(f"Error log: {ERROR_LOG}")
    
    print(f"{'='*60}\n")


def main():
    print(f"Max tokens per chunk: {MAX_TOKENS}")
    print(f"Overlap tokens: {OVERLAP_TOKENS}")
    print(f"Input directory: {INPUT_DIR}\n")
    
    start_time = datetime.now()
    process_all_files()
    elapsed = (datetime.now() - start_time).total_seconds()
    
    print(f"Total time: {elapsed:.1f} seconds\n")


if __name__ == "__main__":
    main()