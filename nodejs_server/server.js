const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const port = 3001
// elastic search 
const { Client } = require('@elastic/elasticsearch');
// Create a client instance
const client = new Client({
  node: `http://35.234.119.103:9200`,
  auth: {
    username: 'elastic',
    password: 'changeme'
  }
})
app.use(bodyParser.json());

// Elastic search - index name for simulator events
const indexName = 'simulator_events';

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