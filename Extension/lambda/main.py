import json
import datetime, uuid
import os, logging
import voyageai
from pinecone import Pinecone

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Global initialisation of API clients 
try:
    vo = voyageai.Client(api_key=os.environ.get("VOYAGE_API_KEY"))
    pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
    pc_index = pc.Index(host=os.environ.get("PINECONE_INDEX_HOST"))
except Exception as e:
    logger.error(f"Error initializing clients: {str(e)}")

def lambda_handler(event, context):
    try:
        if not all([vo, pc, pc_index]):
            raise Exception("API clients failed to initialize.")
        
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        title = body.get('title', '')
        content = body.get('content', '')
        logger.info(f"Processing article: {title[:50]}... ({len(content)} chars)")
        
        if not content:
            return format_response(400, {'error': 'No content provided'})
        
        if len(content) > 100000:
            logger.info("Content too long, truncating to 100k characters")
            content = content[:100000]

        result = voyage_client.embed(content, model="voyage-finance-2", input_type="document")
        article_vector = result.embeddings[0]
        
        query_response = pinecone_index.query(
            vector=article_vector,
            top_k=5,
            namespace=pinecone_namespace,
            include_metadata=True
        )
        
        matches = []
        for match in query_response['matches']:
            matches.append({
                'score': round(match['score'], 4),
                'company': match['metadata'].get('name', ''),
                'ticker': match['metadata'].get('ticker', ''),
                'exchange': match['metadata'].get('exchange', ''),
                'document_type': match['metadata'].get('document_type', ''),
                'filing_type': match['metadata'].get('filing_type', ''),
                'fiscal_period': match['metadata'].get('fiscal_period', ''),
                'fiscal_year': match['metadata'].get('fiscal_year', ''),
                'publication_date': match['metadata'].get('publication_timestamp', '')
            })
        
        logger.info(f"Found {len(matches)} matches for article")
        
        return format_response(200, {
            'title': title,
            'matches': matches
        })
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return format_response(500, {'error': f'Internal server error: {str(e)}'})

def format_response(status_code, body_dict):
    """Helper function to format the API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body_dict)
    }

# For local testing
if __name__ == "__main__":
    test_event = {
        'body': json.dumps({
            'title': 'EU ready to retaliate against Donald Trump’s tariffs, says Ursula von der Leyen',
            'content': 'This is a test article about retail innovation and supply chain optimization.'
        })
    }
    
    if not os.environ.get("VOYAGE_API_KEY"):
        os.environ["VOYAGE_API_KEY"] = "your-voyage-api-key"
    if not os.environ.get("PINECONE_API_KEY"):
        os.environ["PINECONE_API_KEY"] = "your-pinecone-api-key"
    if not os.environ.get("PINECONE_INDEX_HOST"):
        os.environ["PINECONE_INDEX_HOST"] = "your-pinecone-index-host"
    
    response = lambda_handler(test_event, None)
    print(json.dumps(response, indent=2))