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
const indexName = 'event_test_idx';

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

app.listen(port, () => {
    console.log(`server listening on port ${port}`)
})


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

// Usage example

// const indexName = 'event_test_idx';
// const data = {
//   field1: 'value1',
//   field2: 'value2'
// };

// insertData(indexName, data);