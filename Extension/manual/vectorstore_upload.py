import voyageai
import logging, os

from pinecone import Pinecone
from ..vectorstore import Embedding
from dotenv import load_dotenv

class ManualEmbed:
    """
    Responsible for the manual process of embedding stock data and upserting into Pinecone index.
    """
    def __init__(self, input_text, voyage_api_key, voyage_model, voyage_input_type, pinecone_key, pinecone_index_name, pinecone_namespace):
        self.input_text = input_text
        self.voyage_api_key = voyage_api_key
        self.voyage_model = voyage_model
        self.voyage_input_type = voyage_input_type
        self.pinecone_key = pinecone_key
        self.pinecone_index_name = pinecone_index_name
        self.pinecone_namespace = pinecone_namespace

    def create_embeddings(self, sample_text) -> list[float]:
        vo = voyageai.Client(api_key=VOYAGE_API_KEY)
        result = vo.embed(sample_text, model=self.voyage_model, input_type=self.voyage_input_type)
        return result

    def pinecone_upsert(self) -> None:
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

if __name__ == "__main__":
    log = logging.log()
    load_dotenv()
    PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
    VOYAGE_API_KEY = os.environ.get("VOYAGE_API_KEY")
    perform_manual_embedding = ManualEmbed("planet_labs_earnings_transcript.txt", VOYAGE_API_KEY, "voyage-3", "document", PINECONE_API_KEY, "stock-data-index", "ns1")
    perform_manual_embedding.pinecone_upsert()
    


'''
import voyageai
import logging
import os
from pinecone import Pinecone
from dotenv import load_dotenv

class ManualEmbed:
    """
    Responsible for the manual process of embedding stock data and upserting into Pinecone index.
    """
    def __init__(self, input_text, voyage_api_key, voyage_model, voyage_input_type, 
                 pinecone_key, pinecone_index_name, pinecone_namespace):
        self.input_text = input_text
        self.voyage_api_key = voyage_api_key
        self.voyage_model = voyage_model
        self.voyage_input_type = voyage_input_type
        self.pinecone_key = pinecone_key
        self.pinecone_index_name = pinecone_index_name
        self.pinecone_namespace = pinecone_namespace
        
        # Initialize clients
        self.voyage_client = voyageai.Client(api_key=self.voyage_api_key)
        self.pinecone_client = Pinecone(api_key=self.pinecone_key)
        self.index = self.pinecone_client.Index(self.pinecone_index_name)

    def create_embeddings(self, sample_text) -> list[float]:
        """
        Create embeddings using the Voyage AI model.
        
        Args:
            sample_text (str): Text to be embedded
            
        Returns:
            list[float]: Embedding vector
            
        Raises:
            voyageai.VoyageError: If embedding creation fails
        """
        try:
            result = self.voyage_client.embed(
                sample_text, 
                model=self.voyage_model, 
                input_type=self.voyage_input_type
            )
            return result
        except Exception as e:
            logging.error(f"Error creating embeddings: {str(e)}")
            raise

    def pinecone_upsert(self) -> None:
        """
        Read text file, create embeddings, and upsert to Pinecone.
        
        Raises:
            FileNotFoundError: If input file doesn't exist
            Exception: For other errors during upsert
        """
        ticker = 'PL'
        metadata = {'source': self.input_text}  # Added basic metadata
        
        try:
            # Read input file
            file_path = f'{self.input_text}'
            if not file_path.endswith('.txt'):
                file_path += '.txt'
                
            with open(file_path, 'r', encoding='utf-8') as file:
                sample_text = file.read()

            # Create embeddings
            embeddings = self.create_embeddings(sample_text)

            # Upsert to Pinecone
            self.index.upsert(
                vectors=[{
                    "id": ticker,
                    "values": embeddings,
                    "metadata": metadata
                }],
                namespace=self.pinecone_namespace
            )
            logging.info(f"Successfully upserted embeddings for {ticker}")
            
        except FileNotFoundError:
            logging.error(f"Input file not found: {file_path}")
            raise
        except Exception as e:
            logging.error(f"Error during upsert process: {str(e)}")
            raise

def main():
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    try:
        # Load environment variables
        load_dotenv()
        
        # Get API keys from environment
        pinecone_api_key = os.environ.get("PINECONE_API_KEY")
        voyage_api_key = os.environ.get("VOYAGE_API_KEY")
        
        if not all([pinecone_api_key, voyage_api_key]):
            raise ValueError("Missing required API keys in environment variables")

        # Initialize and run embedding process
        embedder = ManualEmbed(
            input_text="planet_labs_earnings_transcript.txt",
            voyage_api_key=voyage_api_key,
            voyage_model="voyage-3",
            voyage_input_type="document",
            pinecone_key=pinecone_api_key,
            pinecone_index_name="stock-data-index",
            pinecone_namespace="ns1"
        )
        
        embedder.pinecone_upsert()
        logging.info("Embedding process completed successfully")
        
    except Exception as e:
        logging.error(f"Failed to complete embedding process: {str(e)}")
        raise

if __name__ == "__main__":
    main()
    '''