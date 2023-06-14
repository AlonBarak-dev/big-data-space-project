const express = require('express')
const bodyParser = require('body-parser');

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


app.post('/simdata', (req, res) => {
    const { name, age, city } = req.body;
    console.log('Received Message:');
    console.log('Name: ', name);
    console.log('Age:', age);
    console.log('City:', city);
    res.sendStatus(200);
  });



app.listen(port, () => {
    console.log(`server listening on port ${port}`)
})