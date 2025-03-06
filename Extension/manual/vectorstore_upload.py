import voyageai
import logging, os

from pathlib import Path
from pinecone import Pinecone
from dotenv import load_dotenv

class Vectorstore:
    def __init__(self, VOYAGE_API_KEY, PINECONE_API_KEY):
        self.voyage_api_key = VOYAGE_API_KEY
        self.pinecone_key = PINECONE_API_KEY
    
    def vectorise_content(self, content):
        vo = voyageai.Client(api_key='pa--a_Og3sUuEzu8bwYaddrWNR9zNVTTOz4FPJnj5vghXc')
        result = vo.embed(content, model="voyage-finance-2", input_type="document")
        return result.embeddings
    
    # Run Embeddings
    '''
    def upload_content(self):
        ticker = 'PL'
        metadata = None
        with open(f'{self.input_text}.txt', 'r', encoding='utf-8') as file:
            sample_text = file.read()
        embeddings = self.create_embeddings(sample_text)
        pc = Pinecone(api_key=self.PINECONE_API_KEY)
        index = pc.Index(self.index_name)
        index.upsert(
            vectors=[{"id": ticker, "values": embeddings, "metadata": metadata}],
            namespace= self.namespace
        )
        '''
    
if __name__ == "__main__":
    #log = logging.log()
    file_path = Path('./manual/earnings_samples/azn_earnings.txt')
    load_dotenv()

    vectorstore = Vectorstore(os.environ.get("PINECONE_API_KEY"), os.environ.get("VOYAGE_API_KEY"))
    azn_earnings = file_path.read_text()
    vector = vectorstore.vectorise_content(azn_earnings)
    print(vector)
    #vectorstore.upload_content()
