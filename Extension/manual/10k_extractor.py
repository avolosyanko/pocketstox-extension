"""
10-K extractor: Items 1 and 1A.
Outputs structured JSON ready for chunking then vectorising.
Includes SEC EDGAR source URL for each filing.
"""

import json
import time
from pathlib import Path
from datetime import datetime
from edgar import Company, set_identity
import pandas as pd


OUTPUT_DIR = "data/extracted_10k"
SUMMARY_DIR = "data"  # Parent directory for summary files
MIN_CHARS = 500  # Minimum section length
SECTIONS = ["item1", "item1a"]  # Business and Risk Factors only
SEC_BASE_URL = "https://www.sec.gov/cgi-bin/viewer"


def construct_source_url(cik: int, accession_number: str) -> str:
    """
    Construct the SEC EDGAR viewer URL for a 10-K filing.
    
    Args:
        cik: Company CIK number
        accession_number: Filing accession number (e.g., "0000034088-25-000010")
    
    Returns:
        Direct link to the filing on SEC EDGAR
    """
    # Format CIK with leading zeros (10 digits)
    cik_formatted = str(cik).zfill(10)
    
    # Accession numbers come in format XXXXXXXXXX-YY-ZZZZZZ, convert to XXXXXXXXXXXXXXXXZZZZZZZ
    accession_clean = accession_number.replace("-", "")
    
    return f"{SEC_BASE_URL}?action=view&cik={cik_formatted}&accession_number={accession_clean}&xbrl_type=v"


def extract_company(ticker: str) -> dict:
    """
    Extract 10-K sections for a company
    Returns dict with extracted data and metadata, or None if failed
    """
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
            
            # Validate minimum length
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
        
        # Construct source URL
        source_url = construct_source_url(company.cik, filing.accession_number)
        
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
        print(f"❌ {ticker}: {str(e)}")
        return None


def save_result(data: dict):
    """Save extraction result to JSON file"""
    if not data:
        return
    
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    filename = f"{data['ticker']}_{data['filing_date']}.json"
    filepath = Path(OUTPUT_DIR) / filename
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def process_tickers(tickers: list):
    """
    Process list of tickers with progress tracking
    Returns summary statistics
    """
    successful = 0
    failed = []
    
    print(f"\nProcessing {len(tickers)} companies...")
    print(f"Output directory: {OUTPUT_DIR}\n")
    
    for i, ticker in enumerate(tickers, 1):
        print(f"[{i}/{len(tickers)}] {ticker}...", end=" ")
        
        result = extract_company(ticker)
        
        if result:
            save_result(result)
            
            # Check section success rate
            section_success = sum(
                1 for s in result['sections'].values() 
                if s['text'] is not None
            )
            
            if section_success == len(SECTIONS):
                print(f"✅ ({section_success}/{len(SECTIONS)} sections)")
                successful += 1
            else:
                print(f"⚠️  ({section_success}/{len(SECTIONS)} sections)")
                failed.append(ticker)
        else:
            print("❌ Failed")
            failed.append(ticker)
        
        # SEC rate limiting: ~6-7 requests/second
        time.sleep(0.15)
    
    # Print summary
    print(f"\n{'='*60}")
    print("EXTRACTION COMPLETE")
    print(f"{'='*60}")
    print(f"Successful: {successful}/{len(tickers)} ({successful/len(tickers)*100:.1f}%)")
    print(f"Failed: {len(failed)}")
    if failed:
        print(f"\nFailed tickers ({len(failed)}):")
        print(", ".join(failed[:20]))
        if len(failed) > 20:
            print(f"... and {len(failed) - 20} more")
    print(f"\nOutput: {OUTPUT_DIR}/")
    print(f"{'='*60}\n")
    
    return {
        "total": len(tickers),
        "successful": successful,
        "failed": len(failed),
        "failed_tickers": failed
    }


def main():
    set_identity("andres.volosyanko@gmail.com")
    MODE = "PRODUCTION"  # 'TEST' or 'PRODUCTION'
    
    if MODE == "TEST":
        print("="*60)
        print("TEST MODE: Running validation on sample companies")
        print("="*60)
        
        test_tickers = ["AAPL", "MSFT", "GOOGL", "JPM", "XOM", "TSLA", "PL", "AMD", "NVDA", "BA"]
        summary = process_tickers(test_tickers)
    
    elif MODE == "PRODUCTION":
        print("="*60)
        print("PRODUCTION MODE: Russell 3000 Backfill")
        print("="*60)
        
        df = pd.read_csv('manual/tickers_sample_500.csv')
        ticker_columns = ['Symbol', 'Ticker', 'TICKER', 'symbol', 'SYMBOL', 'Stock']
        ticker_col = None
        for col in ticker_columns:
            if col in df.columns:
                ticker_col = col
                break
        
        if not ticker_col:
            print(f"❌ Error: Could not find ticker column in CSV")
            print(f"Available columns: {df.columns.tolist()}")
            return
        
        russell_3000 = df[ticker_col].dropna().astype(str).str.strip().tolist()
        print(f"Loaded {len(russell_3000)} tickers from '{ticker_col}' column\n")
            
        # Confirm before processing
        print(f"⚠️  About to process {len(russell_3000)} companies")
        print(f"Estimated time: ~{len(russell_3000) * 0.5 / 60:.0f} minutes")
        response = input("\nProceed? (yes/no): ")
        
        if response.lower() != 'yes':
            print("Cancelled.")
            return
        
        print(f"\nStarting backfill at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        start_time = time.time()
        
        summary = process_tickers(russell_3000)
        
        elapsed = time.time() - start_time
        print(f"Total time: {elapsed/60:.1f} minutes")
        print(f"Average: {elapsed/len(russell_3000):.2f} seconds per company\n")
        
        # Save summary to parent data directory
        Path(SUMMARY_DIR).mkdir(parents=True, exist_ok=True)
        summary_file = Path(SUMMARY_DIR) / f"_extraction_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump({
                **summary,
                "elapsed_minutes": elapsed / 60,
                "completed_at": datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"✅ Summary saved: {summary_file}")
    
    else:
        print(f"❌ Invalid MODE: {MODE}")
        print("Set MODE to 'TEST' or 'PRODUCTION'")


if __name__ == "__main__":
    main()