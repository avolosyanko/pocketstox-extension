import voyageai
import logging, os
import uuid, datetime

from pathlib import Path
from pinecone import Pinecone
from dotenv import load_dotenv


class Vectorstore:
    def __init__(self, VOYAGE_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_HOST):
        self.voyage_api_key = VOYAGE_API_KEY
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.pinecone_index = self.pc.Index(host=PINECONE_INDEX_HOST)
        self.pinecone_namespace = "voyage-ai-embeddings"

    def vectorise_content(self, content):
        vo = voyageai.Client(api_key=self.voyage_api_key)
        result = vo.embed(content, model="voyage-finance-2", input_type="document")
        return result.embeddings[0]

    # Run Embeddings
    def upload_content(self, vector):
        document_id = str(uuid.uuid4())
        current_time = datetime.datetime.now().isoformat()
        ticker = "WMT"
        name = "Walmart Inc"
        exchange = "NYSE"
        document_type = "Earnings Call"
        filing_type = "Transcript"
        fiscal_period = "Q2"
        fiscal_year = "2025"
        publication_date = "2024-08-15"

        self.pinecone_index.upsert(
            vectors=[
                {
                    "id": document_id,
                    "values": vector,
                    "metadata": {
                        "insert_timestamp": current_time,
                        "modified_timestamp": current_time,
                        "ticker": ticker,
                        "name": name,
                        "exchange": exchange,
                        "document_type": document_type,
                        "filing_type": filing_type,
                        "fiscal_period": fiscal_period,
                        "fiscal_year": fiscal_year,
                        "publication_timestamp": publication_date,
                    },
                }
            ],
            namespace=self.pinecone_namespace,
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    log = logging.getLogger(__name__)

    current_time = datetime.datetime.now().isoformat()
    file_path = Path("Extension/manual/earnings_samples/wmt_earnings.txt")
    load_dotenv()

    vectorstore = Vectorstore(
        os.environ.get("VOYAGE_API_KEY"),
        os.environ.get("PINECONE_API_KEY"),
        os.environ.get("PINECONE_INDEX_HOST"),
    )
    azn_earnings = file_path.read_text()
    vector = vectorstore.vectorise_content(azn_earnings)
    vectorstore.upload_content(vector)
    log.info("Vector upserted into Pinecone instance.")
