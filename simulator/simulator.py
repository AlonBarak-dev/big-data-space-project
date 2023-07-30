import requests
import json
from datetime import datetime, timezone
import random
import time
from confluent_kafka import Producer
import redis

class astro_simulator:
    
    def __init__(self, kf_topic, btstrap_servers) -> None:
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
        self.bootstrap_servers = btstrap_servers
        self.kafka_topic = kf_topic
        # load Redis
        self.redis_db = self.load_redis()
        self.redis_key = "Bright_star_catalog"
        if not self.redis_db.exists(self.redis_key):
            print("Saving catalog")
            self.load_catalog_to_redis()
        self.catalog_len = self.redis_db.hlen("Bright_star_catalog")
        
    def load_redis(self):
        redis_host = "35.234.119.103"
        redis_port = 6379
        try:
            redis_db = redis.StrictRedis(redis_host, redis_port, decode_responses=True)
            print("Redis - Connected successfully!")    
            return redis_db
        except(Exception):
            print("Redis - Failed")
            return None
    
    def load_catalog_to_redis(self, file_path="BSC.json"):
        file = open(file_path, "r")
        catalog_list = json.load(file)
        names_catalog = {}
        for idx, item in enumerate(catalog_list):
            name = item["Title HD"]
            names_catalog[str(idx)] = name
        
        for idx, (k, v) in enumerate(names_catalog.items()):
            if idx == 500:
                break
            self.redis_db.hset(self.redis_key, k, v)
            
        print("Catalog Saved successfully in Redis!")
        
    
    
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
    
    def generate_location(self):
        # Generate random RA (Right Ascension) in hours
        ra_hours = random.randint(0, 23)
        ra_minutes = random.randint(0, 59)
        ra_seconds = random.randint(0, 59)
        ra = f"{ra_hours:02d}:{ra_minutes:02d}:{ra_seconds:02d} "
        
        dec_degrees = random.randint(-90, 90)
        dec_minutes = random.randint(0, 59)
        dec_seconds = random.randint(0, 59)
        dec = "+" if dec_degrees > 0 else ""
        dec += f"{dec_degrees:02d}:{dec_minutes:02d}:{dec_seconds:02d}"
                
        return ra + dec
    
    def generate_star(self):
        star_idx = random.randint(0, self.catalog_len)
        star_name = self.redis_db.hget(self.redis_key, star_idx)
        return star_name
    
    def build_message(self, star_name,  date, date_search,  notfac, loc, type, urg):
        message = {
            'star': star_name,
            'date': date,
            'date_search': date_search,
            'notfac': notfac,
            'location': loc,
            'type': type,
            'urg': str(urg)
        }
        
        return message
            
    def generate_data(self):
        
        date = str(datetime.now(timezone.utc))
        date_search = str(datetime.today().date())
        notfac = self.list_of_telescopes[random.randrange(0, 11)]
        loc = self.generate_location()
        type = self.types[random.randrange(0, 5)]
        urg = random.randrange(1, 6)
        star_name = self.generate_star()
        
        return self.build_message(star_name, date, date_search, notfac, loc, type, urg)
    
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
        
        

if __name__ == "__main__":
    print("Generating Events!")
    while True:
        sim = astro_simulator(btstrap_servers='35.234.119.103:9092', kf_topic='raw_simulator_events')
        message = sim.generate_data()
        print(message)
        sim.send_data_to_kafka_topic(message)
        time.sleep(10)
    print("Done Generating Events!")

