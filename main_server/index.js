// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const {Client} = require('@elastic/elasticsearch'); // elastic search
// const { response } = require('express');
const {MongoClient} = require('mongodb');
const {ELASTIC_CONFIG, MONGO_CONN, REDIS_CONFIG, simIndexName, neoIndexName} = require("./config");
const {getCached, caching, getKey} = require("./cache");
const {createClient} = require("redis");
const kafka = require('kafka-node');
const io = require('socket.io');
const http = require('http'); // Import the http module


const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(express.static(__dirname + "/build"));
app.use(getCached);

// Create a new Elastic client instance
const client = new Client(ELASTIC_CONFIG);

// Create a new Redis client instance
const redisClient = new createClient(REDIS_CONFIG);
redisClient.connect();

// Create a new MongoDB instnace 
const mongoClient = new MongoClient(MONGO_CONN)

// create a new Kafka client
const kafkaClient = new kafka.KafkaClient({kafkaHost: "35.234.119.103:9092"});
const consumer = new kafka.Consumer(
  kafkaClient,
  [
      { topic: 'raw_simulator_events', partition: 0 } 
  ],
  {
      autoCommit: true
  }
);
// Socket.IO setup
const server = http.createServer();
const socketIO = io(server);

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

    const ret = {events: events};
    await caching(getKey(JSON.stringify([req.path, req.query])), ret);
    res.json(ret);
    console.log("done")
});

app.get("/get_event_list_date/:from/:to", async (req, res) => {
    const from = req.params.from
    const to = req.params.to

    const events_in_range = await searchEventsInRange(from, to)
    const ret = {events: events_in_range};

    await caching(getKey(JSON.stringify([req.path, req.query])), ret);
    res.json(ret);
})

app.get("/get_event_list_date_by_star/:from/:to/:star_name", async (req, res) => {
    const from = req.params.from
    const to = req.params.to
    const star_name = req.params.star_name

    const events_in_range = await searchEventsInRange(from, to)

    const filtered_events_in_range = events_in_range.filter((event_in_range) => event_in_range.star == star_name)

    const ret = {events: filtered_events_in_range};
    await caching(getKey(JSON.stringify([req.path, req.query])), ret);
    res.json(ret)

})

app.get("/get_event_list_date_by_type/:from/:to/:type", async (req, res) => {
    const from = req.params.from
    const to = req.params.to
    const type = req.params.type

    const events_in_range = await searchEventsInRange(from, to)

    const filtered_events_in_range = events_in_range.filter((event_in_range) => event_in_range.type == type)

    const ret = {events: filtered_events_in_range};
    await caching(getKey(JSON.stringify([req.path, req.query])), ret);
    res.json(ret)

})


app.get("/get_event_list_date_by_notfac/:from/:to/:notfac", async (req, res) => {
    const from = req.params.from
    const to = req.params.to
    const notfac = req.params.notfac

    const events_in_range = await searchEventsInRange(from, to)

    const filtered_events_in_range = events_in_range.filter((event_in_range) => event_in_range.notfac == notfac)

    const ret = {events: filtered_events_in_range};
    await caching(getKey(JSON.stringify([req.path, req.query])), ret);
    res.json(ret);

})


// GET endpoint to count JSONs by urgency
app.get('/countByUrgency', async (req, res) => {
    try {
        // Initialize an object to store the counts
        const countByUrgency = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
        };

        var jsonArray = await getAllEntries(simIndexName)
        jsonArray = jsonArray.hits.hits.map((hit) => {
            return hit["_source"];
        })

        // Loop through the array of JSONs and update the counts
        jsonArray.forEach((json) => {
            var urgency = json.urg;
            countByUrgency[urgency]++;
        });

        res.json(countByUrgency);
    } catch (error) {
        console.error('Error while counting JSONs by urgency:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

app.get("/get_neos_24_hours", async (req, res) => {

    try {
        const neos_24 = await searchDocumentsWithinNext24Hours()
        res.json({"neos": neos_24})
    } catch (error) {
        console.error('Error while searching NEOs:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})


app.get("/get_neos_last_month_by_diameter", async (req, res) => {

    try {
        const neos_last_month = await calculateEstimatedDiametersAndDistribution()
        res.json({"neos": neos_last_month})
    } catch (error) {
        console.error('Error while searching NEOs:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

app.get("/get_solar_flares/:interval", async (req, res) => {
    const interval = req.params.interval

    const result = await extractSolarFlaresWithinLastXHours(interval)
    res.json({solar: result})
})


async function searchDocuments(indexName, query) {
    const response = await client.search({
        index: indexName, body: {
            query: {
                multi_match: {
                    query: query, fields: ["*"],
                },
            }, size: 10000,
        },
    });
    return response;
}

async function getAllEntries(indexName) {
    const response = await client.search({
        index: indexName, body: {
            query: {
                match_all: {},
            }, size: 10000,
        },
    });
    return response;
}

// Function to search for events in a YMD date range
async function searchEventsInRange(from, to) {
    try {
        const response = await client.search({
            index: simIndexName, size: 10000, body: {
                query: {
                    range: {
                        date_search: {
                            gte: from, // Greater than or equal to
                            lte: to, // Less than or equal to
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


async function searchDocumentsWithinNext24Hours() {
    try {
        const now = new Date();
        const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        // console.log(now.toISOString(), twentyFourHoursLater)
        const response = await client.search({
            index: neoIndexName, size: 10000, body: {
                query: {
                    range: {
                        approach_date: {
                            gte: now.toISOString(), lte: twentyFourHoursLater,
                        },
                    },
                },
            },
        });

        const documents = response.hits.hits.map((hit) => hit._source);
        return documents
    } catch (error) {
        console.error('Error while searching documents:', error);
    }
}

async function searchDocumentsWithinLastMonth() {
    try {
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        console.log(now.toISOString(), oneMonthAgo)
        const response = await client.search({
            index: neoIndexName, size: 10000, body: {
                query: {
                    range: {
                        approach_date: {
                            gte: oneMonthAgo, lte: now.toISOString(),
                        },
                    },
                },
            },
        });

        const documents = response.hits.hits.map((hit) => hit._source);
        return documents
    } catch (error) {
        console.error('Error while searching documents:', error);
    }
}

async function calculateEstimatedDiametersAndDistribution() {
    try {
        const response = await searchDocumentsWithinLastMonth()

        // Calculate the estimated diameter and store them in an array
        const estimatedDiameters = response.map((hit) => {
            const maxDiameter = hit.estimated_max_diameter_size_meters;
            const minDiameter = hit.estimated_min_diameter_size_meters;
            return (maxDiameter + minDiameter) / 2;
        });


        // Round the estimated diameters and distribute them into 100m ranges
        const distribution = {};
        estimatedDiameters.forEach((estimatedDiameter) => {
            const rangeStart = Math.floor(estimatedDiameter / 100) * 100;
            const rangeKey = `${rangeStart}-${rangeStart + 100}`;
            distribution[rangeKey] = (distribution[rangeKey] || 0) + 1;
        });

        // If you want to get the maximum estimated diameter, you can do it here
        const maxEstimatedDiameter = Math.max(...estimatedDiameters);

        // Combine the distribution with the maxEstimatedDiameter in the final JSON
        const result = {
            ...distribution, max_estimated_diameter: maxEstimatedDiameter,
        };

        console.log(result);
        return result
    } catch (error) {
        console.error('Error while processing documents:', error);
    }
}

async function extractSolarFlaresWithinLastXHours(interval) {

    const dbName = 'big-data';
    const collectionName = 'solar_flares';

    try {
        await mongoClient.connect();
        const db = mongoClient.db(dbName);
        const collection = db.collection(collectionName);

        // Calculate timestamps for the current time and 2 hours ago
        const currentTime = new Date();
        const twoHoursAgo = new Date(currentTime.getTime() - interval * 60 * 60 * 1000);

        // Query to retrieve documents within the specified timestamp range
        const query = {
            date: {
                $gte: twoHoursAgo.getTime(), // Greater than or equal to 2 hours ago
                $lte: currentTime.getTime(), // Less than or equal to the current time
            },
        };

        // Fetch the documents that match the query
        const result = await collection.find(query).toArray();
        return result
    } catch (error) {
        console.error('Error while extracting documents:', error);
    } finally {
        // Close the MongoDB connection after querying
        await client.close();
    }
}


// Neos using Redis (Cache) & Elastic/MongoDB ((Disk)

app.get("/get_neos_from_db", async (req, res) => {
    const key = "neo_list"
    try {
        const value = await getValueFromCacheOrDisk(key, neoIndexName);
        res.json({key, value});
    } catch (err) {
        res.status(500).json({error: "An error occurred while fetching data."});
    }
})

async function getValueFromCacheOrDisk(key, indexName) {
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
            } else {  // TODO fit for elastic when Eyal is done!
                try {
                    // If the value does not exist in Redis, search in Elasticsearch
                    const {body} = await client.search({
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
                } catch (err) {
                    console.error('Elasticsearch Error:', err);
                    reject(err);
                }
            }
        });
    });
}

app.get("/get_neos", async (req, res) => {
    const stringifiedList = await redisClient.lRange("neos", 0, -1);
    const parsedList = stringifiedList.map((item) => JSON.parse(item));

    return res.json({neo_list: parsedList});
});

app.get("/sun", async (req, res) => {
    const stringifiedSunData = await redisClient.get("sun_forcast");
    const sunData = JSON.parse(stringifiedSunData);

    res.json(sunData);
});

// Handle requests for React pages
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});


// Web socket & Kafka section
socketIO.on('connection', (socket) => {
  console.log('A client connected.');

  consumer.on('message', (message) => {
    // When a new message arrives from the Kafka topic, emit it to connected clients
    console.log(message.value)
    socket.emit('new-message', message.value);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected.');
  });
});

const WSport = 8080;
server.listen(WSport, () => {
  console.log(`Socket.IO server is running on port ${port}`);
});


app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

