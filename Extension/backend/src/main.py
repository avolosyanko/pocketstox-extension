import logging
import DataHandler, Embedding

def main():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    datahandler = DataHandler()
    embedding = Embedding()

if __name__ == "__main__":
    main()