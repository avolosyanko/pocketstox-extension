import json
import os
import logging
import voyageai
from qdrant_client import QdrantClient

logger = logging.getLogger()
logger.setLevel(logging.INFO)

vo_client = None
qdrant_client = None

def initialise_clients():
    """
    API clients initialization with caching for lambda warm starts.
    
    Returns:
        tuple: (voyage_client, qdrant_client)
    """
    global vo_client, qdrant_client
    
    if vo_client is not None and qdrant_client is not None:
        logger.info("Using cached API clients")
        return vo_client, qdrant_client
    
    try:
        vo_api_key = os.environ.get("VOYAGE_API_KEY")
        qdrant_url = os.environ.get("QDRANT_URL")
        qdrant_api_key = os.environ.get("QDRANT_API_KEY")
        
        if not all([vo_api_key, qdrant_url, qdrant_api_key]):
            raise ValueError("Missing required environment variables")

        vo_client = voyageai.Client(api_key=vo_api_key)
        qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)

        logger.info("API clients initialized successfully")
        return vo_client, qdrant_client

    except Exception as e:
        logger.error(f"Failed to initialize clients: {str(e)}")
        raise

def lambda_handler(event, context):
    try:
        vo, qdrant = initialise_clients()
        
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        else:
            body = event.get("body", {})

        title = body.get("title", "")
        content = body.get("content", "")
        logger.info(f"Processing article: {title[:50]}... ({len(content)} chars)")

        if not content:
            return format_response(400, {"error": "No content provided"})

        if len(content) > 50000:
            logger.info("Content too long, truncating to 50k characters")
            content = content[:50000]

        result = vo.embed(content, model="voyage-finance-2", input_type="document")
        article_vector = result.embeddings[0]

        search_results = qdrant.search(
            collection_name="pocketstox-embeddings",
            query_vector=article_vector,
            limit=6,
            with_payload=True
        )

        matches = []
        for hit in search_results:
            matches.append({
                "score": round(hit.score, 4),
                "ticker": hit.payload.get("ticker", ""),
                "company": hit.payload.get("company_name", ""),
                "exchange": hit.payload.get("exchange", ""),
                "cik": hit.payload.get("cik", ""),
                "section": hit.payload.get("section", ""),
                "subsection": hit.payload.get("subsection"),
                "filing_date": hit.payload.get("filing_date", ""),
                "fiscal_year": hit.payload.get("fiscal_year", ""),
                "industry": hit.payload.get("industry", ""),
                "sic_code": hit.payload.get("sic_code", ""),
                "chunk_id": hit.payload.get("chunk_id", ""),
            })

        logger.info(f"Found {len(matches)} matches for article")
        return format_response(200, {"title": title, "matches": matches})

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return format_response(500, {"error": f"Internal server error: {str(e)}"})

def format_response(status_code, body_dict):
    """Helper function to format the API response"""
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json",
        },
        "body": json.dumps(body_dict),
    }

# For local testing
if __name__ == "__main__":
    from test_events import *
    
    logging.basicConfig(level=logging.INFO)
    from dotenv import load_dotenv
    load_dotenv()
    test_event = TRUMP_TARIFF_EVENT

    response = lambda_handler(test_event, None)
    print(json.dumps(response, indent=2))