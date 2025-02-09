import logging
import DataHandler, lambda.Embedding as Embedding

def lambda_handler():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    datahandler = DataHandler()
    embedding = Embedding()

if __name__ == "__main__":
    lambda_handler()