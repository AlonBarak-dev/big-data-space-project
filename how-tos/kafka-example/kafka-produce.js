import kafka from "kafka-node";
import uuid from "uuid";

const client = new kafka.KafkaClient({kafkaHost: "35.234.119.103:9092"});

const producer = new kafka.HighLevelProducer(client);

// For this demo we just log producer errors to the console.
producer.on("error", function(error) {
    console.error(error);
});

const KafkaService = {
    sendRecord: ({ type, userId, sessionId, data }, callback = () => {}) => {
        if (!userId) {
            return callback(new Error("A userId must be provided."));
        }

        const event = {
            id: uuid.v4(),
            timestamp: Date.now(),
            userId: userId,
            sessionId: sessionId,
            type: type,
            data: data
        };

        const buffer = new Buffer.from(JSON.stringify(event));

        // Create a new payload
        const record = [
            {
                topic: "webevents.dev",
                messages: buffer,
                attributes: 1 /* Use GZip compression for the payload */
            }
        ];

        //Send record to Kafka and log result/error
        producer.send(record, callback);
	console.log("sent");
    }
};


producer.on("ready", function() {
    console.log("Kafka Producer is connected and ready.");
KafkaService.sendRecord({type:"yuri", userId:123, sessionId:123, data:"stam"}, function (err, data) {
        console.log(data);
console.log(err);
    });
});
