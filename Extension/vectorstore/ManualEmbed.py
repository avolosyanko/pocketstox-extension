import torch
import logging, os

from transformers import BertModel, BertTokenizer
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file
log = logging.log()

class ManualEmbed:
    """
    Responsible for creating and upserting embeddings to Pinecone index.
    """
    def __init__(self):
        self.PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
        self.index_name = "stock-data-index"
        self.namespace = "ns1"

        self.model_name = "ProsusAI/finbert"

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

        def preprocess_text(text):
            inputs = tokenizer(text, return_tensors="pt", max_length=512, truncation=True, padding="max_length")
            return inputs

        inputs = preprocess_text(sample_text)
        with torch.no_grad():
            outputs = model(**inputs)
            hidden_states = outputs.last_hidden_state
            embeddings = hidden_states.mean(dim=1).squeeze()

        return embeddings
    
    @staticmethod
    def handle_input() -> list[str]:
        return sample_text


if __name__ == "__main__":
    ManualEmbed().pinecone_upsert()