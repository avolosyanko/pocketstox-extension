import torch
from transformers import BertModel, BertTokenizer

def embedding_stock_data():
    model_name = "ProsusAI/finbert"
    tokenizer = BertTokenizer.from_pretrained(model_name)
    model = BertModel.from_pretrained(model_name)

    def preprocess_text(text):
        inputs = tokenizer(text, return_tensors="pt", max_length=512, truncation=True, padding="max_length")
        return inputs
    
    sample_text = ""

    inputs = preprocess_text(sample_text)
    
    with torch.no_grad():
        outputs = model(**inputs)
        hidden_states = outputs.last_hidden_state
        embeddings = hidden_states.mean(dim=1).squeeze()

    print(embeddings)

if __name__ == "__main__":
    embedding_stock_data()