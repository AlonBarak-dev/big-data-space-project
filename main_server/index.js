// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch'); // elastic search
const Redis = require('ioredis');   // redis
const { response } = require('express');

const app = express();

const port = 3000;
const index = "events";

app.use(bodyParser.json());
app.use(express.static(__dirname + "/build"));

const simIndexName = 'raw_simulator_events'; // Elastic search - index name for simulator events
const neoIndexName = 'neos'

// Create a new Elastic client instance
const client = new Client({
  node: `http://35.234.119.103:9200`,
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
})

// Create a new Redis client instance
const redis = new Redis({
  host: '35.234.119.103', // Redis server host
  port: 6379,        // Redis server port
});


// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));
app.use(bodyParser.json());


// This function return the events list.
app.get("/get_event_list", async (req, res) => {
  const queryValue = req.query.query;
  let results;

  if (queryValue) {
    results = await searchDocuments(simIndexName, queryValue);
    console.log("Searching For: ", queryValue);
  } else {
    console.log("Searching for all enteries")
    results = await getAllEntries(simIndexName);
  }

  const events = results.hits.hits.map((hit) => {
    return hit["_source"];
  });

  res.json({ events: events });
  console.log("done")
});

app.get("/get_event_list_date/:from/:to/:star_name", async (req, res) => {
  const from = req.params.from
  const to = req.params.to
  const star_name = req.params.star_name

  const events_in_range = await searchEventsInRange(from, to)
  
  const filtered_events_in_range = events_in_range.filter((event_in_range) => event_in_range.star == star_name)

  res.json({events: filtered_events_in_range})
  
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

// Function to search for events in a YMD date range
async function searchEventsInRange(from, to) {
  try {
    const response = await client.search({
      index: simIndexName, // Replace with your index name
      body: {
        query: {
          range: {
            date_search: {
              gte: from, // Greater than or equal to "2023-07-26 00:00:00.000000"
              lte: to, // Less than or equal to "2023-07-28 23:59:59.999999"
            },
          }
        }
      }
    });
    const events = response.hits.hits.map((hit) => hit._source);
    return events
  } catch (error) {
    console.error('Error while searching events:', error);
  }
}


// Neos using Redis (Cache) & Elastic/MongoDB ((Disk)

app.get("/get_neos_from_db", async (req, res) => {
  const key = "neo_list"
  try {
    const value = await getValueFromCacheOrDisk(key, neoIndexName);
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
})

async function getValueFromCacheOrDisk(key, indexName) {
  // Try to get the value from Redis
  return new Promise((resolve, reject) => {
    redis.get(key, async (err, value) => {
      if (err) {
        console.error('Redis GET Error:', err);
        reject(err);
        return;
      }
      // If the value exists in Redis, resolve with it
      if (value !== null) {
        resolve(value);
      } 
      else {  // TODO fit for elastic when Eyal is done!
        try {
          // If the value does not exist in Redis, search in Elasticsearch
          const { body } = await client.search({
            index: indexName, // Replace with your Elasticsearch index
            body: {
              query: {
                term: {
                  key: key, // Replace 'key' with the actual field name in your Elasticsearch documents
                },
              },
            },
          });

          // Assuming it is a LIST 
          const neoList = body.hits.hits.map((hit) => {
            return hit["_source"].value // TODO - Replace 'value' with the actual field name containing the value
          })
          resolve(neoList);
        } 
        catch (err) {
          console.error('Elasticsearch Error:', err);
          reject(err);
        }
      }
    });
  });
}

app.get("/get_neos", async(req, res) => {
	const stringifiedList = await redis.lrange("neos", 0, -1);
	const parsedList = stringifiedList.map((item) => JSON.parse(item));

	return res.json({ neo_list: parsedList });
});
    
app.get("/sun", async(req, res) => {
	const stringifiedSunData = await redis.get("sun_forcast");
	const sunData = JSON.parse(stringifiedSunData);

	res.json(sunData);
});

// Handle requests for React pages
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});

