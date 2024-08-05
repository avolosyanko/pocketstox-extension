import logging
from transformers import AutoTokenizer, AutoModelForSequenceClassification

log = logging.Logger(__name__)

class Embedding:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
        self.model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert")

    def embed_query():
        return None