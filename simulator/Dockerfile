FROM python:3.10.6

WORKDIR /usr/src/app

COPY . .

RUN pip install requests
RUN pip install confluent-kafka
RUN pip install redis

CMD ["python3", "simulator.py"]
