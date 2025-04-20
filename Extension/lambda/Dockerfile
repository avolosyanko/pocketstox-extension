FROM python:3.12-slim

WORKDIR /var/task

COPY requirements.txt .
RUN pip install -r requirements.txt
COPY lambda_function.py .

CMD ["lambda_function.lambda_handler"]
