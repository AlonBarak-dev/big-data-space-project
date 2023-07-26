const express = require('express')
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch'); // elastic search
const kafka = require('kafka-node');

const app = express()
app.use(bodyParser.json());

const port = 3001
const indexName = 'simulator_events'; // Elastic search - index name for simulator events
// Create a client instance
const client = new Client({
  node: `http://35.234.119.103:9200`,
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
})

// create a new kafka client
const kafkaClient = new kafka.KafkaClient({
  kafkaHost: "35.234.119.103:9092"
});

const consumer = new kafka.Consumer(
  kafkaClient,
  [
      { topic: 'webevents.dev', partition: 0 }    // TODO change topic name
  ],
  {
      autoCommit: false
  }
);

// This function return the events list.
app.get("/get_event_list", async (req, res) => {
  const queryValue = req.query.query;
  let results;

  if (queryValue) {
    results = await searchDocuments(indexName, queryValue);
    console.log(results);
    console.log("Searching For: ", queryValue);
  } else {
    results = await getAllEntries(indexName);
  }

  const events = results.hits.hits.map((hit) => {
    return hit["_source"];
  });

  res.json({ events: events });
});


async function searchDocuments(indexName, query) {
  const response = await client.search({
    index: indexName,
    body: {
      query: {
        multi_match: {
          query: query,
          fields: ["*"],
        },
      },
      size: 10000,
    },
  });
  return response;
}

async function getAllEntries(indexName) {
  const response = await client.search({
    index: indexName,
    body: {
      query: {
        match_all: {},
      },
      size: 10000,
    },
  });
  return response;
}


// This function insert data to elastic search DB.
async function insertData(indexName, data) {
  try {
    const response = await client.index({
      index: indexName,
      body: data
    });

    await client.indices.refresh({index: indexName})

    console.log('Data inserted:', response);
  } catch (error) {
    console.error('Error inserting data:', error);
  }
}


// Kafka Section:

consumer.on('message', function (message) {
  try{
    const parsedData = JSON.parse(message.value)
    insertData(indexName, parsedData)
  }
  catch(error){
    console.log(message)
  }
    console.log(message)
});

consumer.on('ready', () => {
  console.log('Consumer is ready!');
});

// Start consuming messages
consumer.on('connect', () => {
  console.log('Consumer connected to Kafka');
});

// Handle consumer disconnection
consumer.on('close', () => {
  console.log('Consumer disconnected from Kafka');
});

// Handle consumer errors
consumer.on('error', (error) => {
  console.error('Consumer error:', error);
});




app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})