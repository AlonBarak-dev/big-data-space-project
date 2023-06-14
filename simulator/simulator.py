import requests
import json

def publish_data(data):
    url = 'http://localhost:3000/simdata'  # Replace with your server URL
    headers = {'Content-Type': 'application/json'}
    json_data = json.dumps(data)

    response = requests.post(url, data=json_data, headers=headers)

    if response.status_code == 200:
        print('Data published successfully!')
    else:
        print('Failed to publish data:', response.text)


# Example data to publish
data = {
    'name': 'John Doe',
    'age': 30,
    'city': 'New York'
}

publish_data(data)
