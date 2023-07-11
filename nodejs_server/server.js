const express = require('express')
const bodyParser = require('body-parser');

// elastic search 
const config = require('config')
const elasticConfig = config.get('elastic')

const { Client } = require('elasticsearch');
// Create a client instance
const client = new Client({
             node: 'http://35.234.119.103:5601',
             auth:{
              username: elasticConfig.username, 
              passward: elasticConfig.passward
             } })


const app = express()
const port = 3000
app.use(bodyParser.json());



app.get('/simdata2', (req, res) => {
  const message = {
    id: 1,
    text: 'Hello, World!',
    timestamp: Date.now()
  };

  res.render('message', { message });
});

app.get('/', (req, res) => {
    res.send("Hello World!")
})

async function insertData(indexName, data) {
  try {
    const response = await client.index({
      index: indexName,
      body: data
    });

    console.log('Data inserted:', response);
  } catch (error) {
    console.error('Error inserting data:', error);
  }
}


app.post('/simdata', (req, res) => {
    const { Date, notfac, loc, type, urg } = req.body;
    console.log('Received Message: ~~~~~~~~~~~~~~~~');
    console.log('Date: ', Date);
    console.log('Notifing factor: ', notfac);
    console.log('Location: ', loc);
    console.log('Type of event: ', type);
    console.log('Urgency Level: ', urg);
    res.sendStatus(200);
  });



app.listen(port, () => {
    console.log(`server listening on port ${port}`)
})



// Usage example
const indexName = 'event_test_idx';
const data = {
  field1: 'value1',
  field2: 'value2'
};

insertData(indexName, data);