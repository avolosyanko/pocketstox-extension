import json
import os
import logging
import voyageai
from pinecone import Pinecone

logger = logging.getLogger()
logger.setLevel(logging.INFO)

vo_client = None
pc_index = None

def initialise_clients():
    """
    API clients initialization with caching for lambda warm starts.
    
    Returns:
        tuple: (voyage_client, pinecone_index)
    """
    global vo_client, pc_index
    
    if vo_client is not None and pc_index is not None:
        logger.info("Using cached API clients")
        return vo_client, pc_index
    
    try:
        vo_api_key = os.environ.get("VOYAGE_API_KEY")
        pc_api_key = os.environ.get("PINECONE_API_KEY")
        pc_index_host = os.environ.get("PINECONE_INDEX_HOST")
        
        if not all([vo_api_key, pc_api_key, pc_index_host]):
            raise ValueError("Missing required environment variables")

        vo_client = voyageai.Client(api_key=vo_api_key)
        pc = Pinecone(api_key=pc_api_key)
        pc_index = pc.Index(host=pc_index_host)

        logger.info("API clients initialized successfully")
        return vo_client, pc_index

    except Exception as e:
        logger.error(f"Failed to initialize clients: {str(e)}")
        raise

def lambda_handler(event, context):
    try:
        vo, pc_index = initialise_clients()
        
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

        query_response = pc_index.query(
            namespace="pocketstox-embeddings-db",
            vector=article_vector,
            top_k=5,
            include_metadata=True,
        )

        matches = []
        for match in query_response["matches"]:
            matches.append({
                "score": round(match["score"], 4),
                "ticker": match["metadata"].get("ticker", ""),
                "company": match["metadata"].get("name", ""),
                "exchange": match["metadata"].get("exchange", ""),
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