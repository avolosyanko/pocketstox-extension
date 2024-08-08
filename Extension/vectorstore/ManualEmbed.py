import torch
import logging, os

from transformers import BertModel, BertTokenizer
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file
log = logging.log()

class ManualEmbed:
    """
    Responsible for the manual process of embedding stock data and upserting into Pinecone index.
    """
    def __init__(self, model_name: str, api_key: str, index_name: str, namespace: str):
        self.model_name = model_name
        self.api_key = api_key
        self.index_name = index_name
        self.namespace = namespace

    def pinecone_upsert(self) -> None:
        ticker = None
        embeddings = self.create_embeddings()
        metadata = None

        pc = Pinecone(api_key=self.PINECONE_API_KEY)
        index = pc.Index(self.index_name)

        index.upsert(
            vectors=[{"id": ticker, "values": embeddings, "metadata": metadata}],
            namespace= self.namespace
        )

    def create_embeddings(self, sample_text) -> list[float]:
        tokenizer = BertTokenizer.from_pretrained(self.model_name)
        model = BertModel.from_pretrained(self.model_name)

        def _preprocess_text(self, text: str) -> dict:
            return self.tokenizer(text, return_tensors="pt", max_length=512, truncation=True, padding="max_length")
        
        inputs = _preprocess_text(sample_text)
        with torch.no_grad():
            outputs = model(**inputs)
            hidden_states = outputs.last_hidden_state
            embeddings = hidden_states.mean(dim=1).squeeze()

        return embeddings
    
    @staticmethod
    def handle_input() -> list[str]:
        return sample_text


if __name__ == "__main__":
    PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
    ManualEmbed("ProsusAI/finbert", PINECONE_API_KEY, "stock-data-index", "ns1")
