// server.js
const express = require('express');
const path = require('path');
const axios = require("axios");
const bodyParser = require('body-parser');
const { Client } = require('@elastic/elasticsearch'); // elastic search
const Redis = require('ioredis');   // redis

const port = process.env.PORT || 3000;
const app = express();

const KEY = "DdYnXnHGhGOgBhdoKoIvo5IyprK7EKfqiZtmKrjo";
const neo_url = "https://api.nasa.gov/neo/rest/v1/feed";
const simIndexName = 'simulator_events'; // Elastic search - index name for simulator events
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
    console.log(results);
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


// Neos using Redis (Cache) & Elastic/MongoDB ((Disk)

app.get("/get_neos_from_db", async (req, res) => {
  const key = "neo_list"
  try {
    const value = await getValueFromRedisOrElasticsearch(key);
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
})

async function getValueFromCacheOrDisk(key) {
  // Try to get the value from Redis
  return new Promise((resolve, reject) => {
    redisClient.get(key, async (err, value) => {
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
          const { body } = await elasticClient.search({
            index: neoIndexName, // Replace with your Elasticsearch index
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


app.get("/get_neos", (req, res) => {
  const end_date = new Date();
  end_date.setDate(end_date.getDate() + 1);
  const end_date_formatted = formatDate(end_date);

  const start_date = new Date();
  start_date.setDate(end_date.getDate() - 6);
  const start_date_formatted = formatDate(start_date);

  var url =
    neo_url +
    `?start_date=${start_date_formatted}&end_date=${end_date_formatted}&api_key=${KEY}`;

  axios
    .get(url)
    .then((response) => {
      console.log("New request!");
      result = processNEOResponse(response.data);
      res.json({ neo_list: result["neo_list"], count: result["count"] });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

// Handle requests for React pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const processNEOResponse = function (res) {
  var neos = res.near_earth_objects;
  var result = {
    neo_list: [],
    count: {
      labels: [],
      datasets: { label: "Number of NEO's", data: [] },
    },
  };

  // get all neos, original message gives them based on date
  const ordered_neos = [];
  for (var date in neos) {
    for (var idx in neos[date]) {
      ordered_neos.push(neos[date][idx]);
    }
  }

  // get neos in the next 24 hours
  for (var neo_idx in ordered_neos) {
    let neo = ordered_neos[neo_idx];
    let close_approach_data = neo["close_approach_data"]["0"];
    if (isInNext24Hours(close_approach_data["close_approach_date_full"])) {
      result["neo_list"].push({
        name: neo["name"],
        is_potentially_hazardous: neo["is_potentially_hazardous_asteroid"]
          ? "Yes"
          : "No",
        approach_date: close_approach_data["close_approach_date_full"],
      });
    }
  }

  // count neos for each day
  var date_count_pairs = [];
  for (var date in neos) {
    count = 0;
    for (idx in neos[date]) {
      count++;
    }
    date_count_pairs.push({ date: date, count: count });
  }

  date_count_pairs.sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });

  for (var pair_idx in date_count_pairs) {
    var pair = date_count_pairs[pair_idx];
    result["count"]["labels"].push(pair["date"]);
    result["count"]["datasets"]["data"].push(pair["count"]);
  }

  return result;
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isInNext24Hours(dateTimeString) {
  const targetDate = new Date(dateTimeString);
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - targetDate.getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (timeDifference <= twentyFourHours) {
    return true;
  } else {
    return false;
  }
}
