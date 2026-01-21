"""
10-K extractor (items 1 and 1A) outputs json to data/extracted_10k ready for embedding.
"""

import json
import time
from pathlib import Path
from datetime import datetime
from edgar import Company, set_identity
import pandas as pd

SCRIPT_DIR = Path(__file__).parent
SUMMARY_DIR = SCRIPT_DIR / "data"
OUTPUT_DIR = SCRIPT_DIR / "data" / "extracted_10k"

MIN_CHARS = 500 # QA check
SECTIONS = ["item1", "item1a"]
SEC_BASE_URL = "https://www.sec.gov/cgi-bin/viewer"


def extract_company(ticker: str) -> dict:
    try:
        company = Company(ticker)
        filings = company.get_filings(form="10-K", amendments=False)
        filing = filings.latest()
        tenk = filing.obj()
    
        sections = {}
        section_map = {
            "item1": ["business"],
            "item1a": ["risk_factors"]
        }
        
        for section_key, possible_names in section_map.items():
            text = None
            
            for name in possible_names:
                text = getattr(tenk, name, None)
                if text:
                    break
            
            if text and len(text) >= MIN_CHARS:
                sections[section_key] = {
                    "text": text,
                    "char_count": len(text)
                }
            else:
                sections[section_key] = {
                    "text": None,
                    "error": f"Too short or missing: {len(text) if text else 0} chars"
                }
        
        cik_formatted = str(company.cik).zfill(10)
        accession_clean = filing.accession_number.replace("-", "")
        source_url = f"{SEC_BASE_URL}?action=view&cik={cik_formatted}&accession_number={accession_clean}&xbrl_type=v"
        
        return {
            "ticker": ticker,
            "company_name": company.name,
            "cik": company.cik,
            "form_type": "10-K",
            "filing_date": str(filing.filing_date),
            "period_of_report": str(filing.period_of_report),
            "fiscal_year": filing.filing_date.year,
            "accession_number": filing.accession_number,
            "source_url": source_url,
            "sic_code": getattr(company, 'sic', None),
            "industry": getattr(company, 'industry', None),
            "sections": sections,
            "extracted_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"FAILED {ticker}: {str(e)}")
        return None


def save_result(data: dict):
    if not data:
        return
    
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{data['ticker']}_{data['filing_date']}.json"
    filepath = Path(OUTPUT_DIR) / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def process_tickers(tickers: list):
    successful = 0
    failed = []
    print(f"Processing {len(tickers)} companies...")
    print(f"Output directory: {OUTPUT_DIR}\n")

    for i, ticker in enumerate(tickers, 1):
        print(f"[{i}/{len(tickers)}] {ticker}...", end=" ")
        result = extract_company(ticker)
        if result:
            save_result(result)
            section_success = sum(
                1 for s in result['sections'].values()
                if s['text'] is not None
            )
    
            if section_success == len(SECTIONS):
                print(f"({section_success}/{len(SECTIONS)} sections)")
                successful += 1
            else:
                print(f"({section_success}/{len(SECTIONS)} sections)")
                failed.append(ticker)
        else:
            print("Failed")
            failed.append(ticker)
        
        time.sleep(0.15) # SEC rate limiting
        
    print("EXTRACTION COMPLETE")
    print(f"Successful: {successful}/{len(tickers)}")
    print(f"Failed: {len(failed)}")
    if failed:
        print(f"\nFailed tickers:")
        print(", ".join(failed[:20]))
        if len(failed) > 20:
            print(f"... and {len(failed) - 20} more")
    print(f"\nOutput: {OUTPUT_DIR}/")

    return {
        "total": len(tickers),
        "successful": successful,
        "failed": len(failed),
        "failed_tickers": failed
    }


def main():
    print(f"Ingesting tickers_sample_500.csv")
    csv_path = SCRIPT_DIR / 'tickers_sample_500.csv'
    df = pd.read_csv(csv_path)
    tickers = df['Ticker'].dropna().astype(str).str.strip().tolist()
    print(f"Loaded {len(tickers)} tickers")
    
    response = input("\nProceed? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled.\n")
        return
    
    print(f"\nStarting backfill at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    start_time = time.time()
    summary = process_tickers(tickers)
    elapsed = time.time() - start_time
    print(f"Total runtime: {elapsed/60:.1f} minutes")
    
    Path(SUMMARY_DIR).mkdir(parents=True, exist_ok=True)
    summary_file = Path(SUMMARY_DIR) / f"_extraction_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(summary_file, 'w') as f:
        json.dump({
            **summary,
            "elapsed_minutes": elapsed / 60,
            "completed_at": datetime.now().isoformat()
        }, f, indent=2)
    print(f"Summary saved: {summary_file}\n")

if __name__ == "__main__":
    set_identity("andres.volosyanko@gmail.com")
    main()