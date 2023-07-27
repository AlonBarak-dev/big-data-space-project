const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { Client } = require("elasticsearch");
const Redis = require("ioredis");

const app = express();
const client = new Client({ node: "http://localhost:9200" });
const redis = new Redis(); 

const port = 3000;
const index = "events";

app.use(bodyParser.json());
app.use(express.static(__dirname + "/build"));

app.get("/get_neos", async(req, res) => {
	const stringifiedList = await redis.lrange("neos", 0, -1);
	const parsedList = stringifiedList.map((item) => JSON.parse(item));

	return res.json({ neo_list: parsedList });
});
    
app.get("/sun", async(req, res) => {
	const stringifiedSunData = await redis.get("sun_forcast");
	const sunData = JSON.parse(stringifiedSunData);

	res.json(sunData);
});

app.get("/get_event_list", async (req, res) => {
	const queryValue = req.query.query;
	let results;

	if (queryValue) {
		results = await searchDocuments(index, queryValue);
		console.log(results);
		console.log("Searching For: ", queryValue);
	} else {
		results = await getAllEntries(index);
	}

	const events = results.hits.hits.map((hit) => {
		return hit["_source"];
	});

	res.json({ events: events });
});

// Handle requests for React pages
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});

async function searchDocuments(index, query) {
	const response = await client.search({
		index: index,
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

async function getAllEntries(index) {
	const response = await client.search({
		index: index,
		body: {
			query: {
				match_all: {},
			},
			size: 10000,
		},
	});
	return response;
}

