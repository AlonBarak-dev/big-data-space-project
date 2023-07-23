import requests
import json
from datetime import datetime, timezone
import random
import time
from confluent_kafka import Producer

class astro_simulator:
    
    def __init__(self) -> None:
        self.date = ""
        self.notfac = ""
        self.loc = ""
        self.type = ""
        self.urg = 1
        self.list_of_telescopes = ['MMT', 'Gemini', 'Very Large', 'Subaru',
                                   'Large Binocular', 'Southern African', 
                                   'Keck 1 and 2', 'Hobby-Eberly', 'Gran canarias', 
                                   'THe Giant Magellan', 'Thirty Meter', 'European Extremly Large']
        self.types = ['GRB', 'Apparent Brightness Rise', 'UV Rise', 'X-Ray Rise', 'Comet']
        self.url = 'http://localhost:3001/simdata'  # change when dumping REST!
        self.headers = {'Content-Type': 'application/json'}
        self.bootstrap_servers = '35.234.119.103:9092'
        self.kafka_topic = 'webevents.dev'
        
    def publish_data(self, data):
        """_summary_
            This method sends data using REST api.
        Args:
            data (_type_): _description_
        """
        json_data = json.dumps(data)
        response = requests.post(self.url, data=json_data, headers=self.headers)
        if response.status_code == 200:
            print('Data published successfully!')
        else:
            print('Failed to publish data:', response.text)
    
    def generate_ra(self):
        # Generate random RA (Right Ascension) in hours
        ra_hours = random.randint(0, 23)
        ra_minutes = random.randint(0, 59)
        ra_seconds = random.randint(0, 59)
        ra = f"{ra_hours:02d}h {ra_minutes:02d}m {ra_seconds:02d}s"
        return ra
    
    def build_message(self, date, notfac, loc, type, urg):
        message = {
            'Date': date,
            'notfac': notfac,
            'loc': loc,
            'type': type,
            'urg': str(urg)
        }
        
        return message
            
    def generate_data(self):
        self.date = str(datetime.now(timezone.utc))
        self.notfac = self.list_of_telescopes[random.randrange(0, 11)]
        self.loc = self.generate_ra()
        self.type = self.types[random.randrange(0, 5)]
        self.urg = random.randrange(0, 5)
        
        return self.build_message(self.date, self.notfac, self.loc, self.type, self.urg)
    
    def send_data_to_kafka_topic(self, data):
        """
            Send data to a Kafka topic.

            Parameters:
                bootstrap_servers (str): Comma-separated list of Kafka broker addresses (e.g., 'localhost:9092').
                topic (str): The Kafka topic to which the data will be sent.
                data (str): The data to send to the Kafka topic.

            Returns:
                bool: True if the data is sent successfully, False otherwise.
        """
        # Kafka Producer configuration
        conf = {
            'bootstrap.servers': self.bootstrap_servers,
        }

        # Create a Kafka Producer
        producer = Producer(conf)

        try:
            
            # prepare the data
            serialized_data = json.dumps(data)
            
            # Produce the message
            producer.produce(self.kafka_topic, value=serialized_data)

            # Flush the producer to ensure the message is sent to the broker
            producer.flush()

            return True

        except Exception as e:
            print(f"Failed to send data to Kafka: {e}")
            return False

        # finally:
        #     # Close the producer to release its resources
        #     # producer.close()
        
        

if __name__ == "__main__":
    sim = astro_simulator()
    for i in range(10):
        message = sim.generate_data()
        
        bootstrap_servers = '35.234.119.103:9092'
        kafka_topic = 'webevents.dev'
        
        sim.send_data_to_kafka_topic(message)
        
        time.sleep(2)

