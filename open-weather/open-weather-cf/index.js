
const kafka = require('kafka-node');
const axios = require('axios');
const functions = require('@google-cloud/functions-framework');

const KAFKA_HOST = "35.234.119.103:9092"
const KAFKA_TOPIC = "open_weather_events"
const API_KEY = "5e4cc01495dc3588c1ddfecdfe48d1e9"; // TODO: remove this not supposed to be here

const REGIONS_TO_SCAN = ["China", "Russia", "Africa", "United States", "Antarctica", "Australia"]

// Register an HTTP function with the Functions Framework that will be executed
// when you make an HTTP request to the deployed function's endpoint.
functions.http('ow_scraper', async (req, res) => {
    const client = new kafka.KafkaClient({kafkaHost: KAFKA_HOST});
    const producer = new kafka.HighLevelProducer(client);


    for (const region of REGIONS_TO_SCAN) {
        try{
            let data = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${region}&APPID=${API_KEY}`)

            const buffer = new Buffer.from(JSON.stringify(data.data));
            const record = [
                {
                    topic: KAFKA_TOPIC,
                    messages: buffer,
                    attributes: 1 /* Use GZip compression for the payload */
                }
            ];

            //Send record to Kafka and log result/error
            producer.send(record, (err, data) =>{
                console.log(data);
                if(err){
                    console.error(err);
                }
            });
        } catch (e) {
            console.error(e);
        }
    }

});


