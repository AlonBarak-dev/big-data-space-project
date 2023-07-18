const express = require('express')
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch'); // elastic search
const Redis = require('ioredis');   // redis

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

// Create a new Redis instance
const redis = new Redis({
  host: '35.234.119.103', // Redis server host
  port: 6379,        // Redis server port
});

// Using REST-API meanwhile to communicate with the simulator
app.post('/simdata', (req, res) => {
    const { Date, notfac, loc, type, urg } = req.body
    console.log('Received Message: ~~~~~~~~~~~~~~~~')
    console.log('Date: ', Date)
    console.log('Notifing factor: ', notfac)
    console.log('Location: ', loc)
    console.log('Type of event: ', type)
    console.log('Urgency Level: ', urg)
    insertData(indexName, req.body)

    // save important data in redis cache
    redis.set(type, Date)
    .then(() => {
      console.log('Data added to Redis successfully!');
    })
    .catch((error) => {
      console.error('Error adding data to Redis:', error);
    });

    res.sendStatus(200);
  });


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

app.get("/get_events_dates", async (req, res) => {
  let results;
  results = await getAllKeysRedis();
  res.send(results);

})

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

// Function to retrieve all keys and their corresponding values
async function getAllKeysRedis() {
  let cursor = '0';
  const allKeys = [];

  do {
    const [newCursor, keys] = await redis.scan(cursor);
    cursor = newCursor;

    for (const key of keys) {
      const value = await redis.get(key);
      allKeys.push({ key, value });
    }
  } while (cursor !== '0');

  return allKeys;
}


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


app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})