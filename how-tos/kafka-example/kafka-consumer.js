import kafka from "kafka-node";
import uuid from "uuid";

const client = new kafka.KafkaClient({kafkaHost: "35.234.119.103:9092"});

const consumer = new kafka.Consumer(
        client,
        [
            { topic: 'webevents.dev', partition: 0 }
        ],
        {
            autoCommit: false
        }
    );

consumer.on('message', function (message) {
    console.log(message);
});
