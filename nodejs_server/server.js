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