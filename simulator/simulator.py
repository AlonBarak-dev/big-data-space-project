import requests
import json
from datetime import datetime, timezone
import random
import time

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
        
        
    def publish_data(self, data):
        url = 'http://localhost:3000/simdata'  # Replace with your server URL
        headers = {'Content-Type': 'application/json'}
        json_data = json.dumps(data)

        response = requests.post(url, data=json_data, headers=headers)

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
        

if __name__ == "__main__":
    sim = astro_simulator()
    for i in range(10):
        message = sim.generate_data()
        sim.publish_data(message)
        time.sleep(2)

