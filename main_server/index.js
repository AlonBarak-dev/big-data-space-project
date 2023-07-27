const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const { Client } = require("elasticsearch");
const Redis = require("ioredis");

const app = express();
const client = new Client({ node: "http://localhost:9200" });
const redis = new Redis(); 

const port = 3000;
const index = "events";
const skylive_url = "https://theskylive.com/";
const sun_url = skylive_url + "sun-info";

app.use(bodyParser.json());
app.use(express.static(__dirname + "/build"));

app.get("/get_neos", async(req, res) => {
	const stringifiedList = await redis.lrange("neos", 0, -1);
	const parsedList = stringifiedList.map((item) => JSON.parse(item));

	return res.json({ neo_list: parsedList });
});
    
app.get("/sun", (req, res) => {
	axios
		.get(sun_url)
		.then((response) => {
			const $ = cheerio.load(response.data);

			const sunDescription = $("p.object_headline_text").text();
			const sunActivityImageURL = $("div.sun_container img").attr("src");
			const sunPositionURL = $(
				".main_content > div:nth-child(19) > div:nth-child(8) > div:nth-child(1) > a:nth-child(1) > img:nth-child(1)"
			).attr("src");

			const rightAscension = $(
				"div.keyinfobox:nth-child(8) > ar:nth-child(2)"
			).text();

			const declination = $(
				"div.keyinfobox:nth-child(9) > ar:nth-child(2)"
			).text();

			const constellation = $(
				"div.keyinfobox:nth-child(10) > ar:nth-child(2) > a:nth-child(1)"
			).text();

			const magnitude = $(
				"div.keyinfobox:nth-child(11) > ar:nth-child(2)"
			).text();

			const activityImageURL = skylive_url + sunActivityImageURL;
			const positionImageURL = skylive_url + sunPositionURL;

			res.json({
				sunDescription: sunDescription,
				activityImagePath: activityImageURL,
				positionImagePath: positionImageURL,
				rightAscension: rightAscension,
				declination: declination,
				constellation: constellation,
				magnitude: magnitude,
			});
		})
		.catch((error) => {
			// Handle any errors that occurred during the request
			console.error(error);
			res.status(500).send("Internal Server Error");
		});
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

