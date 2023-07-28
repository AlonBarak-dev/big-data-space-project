const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const Redis = require("ioredis");
const { Client } = require('@elastic/elasticsearch'); // elastic search
const { MongoClient } = require('mongodb');

const KEY = "DdYnXnHGhGOgBhdoKoIvo5IyprK7EKfqiZtmKrjo";

const app = express();

const port = 3333;
const neo_url = "https://api.nasa.gov/neo/rest/v1/feed";
const skylive_url = "https://theskylive.com/";
const sun_url = skylive_url + "sun-info";
const mongoURL = 'mongodb+srv://big-data-space:Aa123456@big-data-space.wlxmqwy.mongodb.net/?retryWrites=true&w=majority' // MongoDB 

// Create a new Elastic client instance
const client = new Client({
	node: `http://35.234.119.103:9200`,
	auth: {
		username: 'elastic',
		password: 'changeme'
	}
})

// Create a new Redis client instance
const redis = new Redis({
	host: '35.234.119.103', // Redis server host
	port: 6379,        // Redis server port
});

const mongoClient = new MongoClient(mongoURL);

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});

const scrapNeos = () => {
	console.log("Scraping NEO's");
	const end_date = new Date();
	end_date.setDate(end_date.getDate() + 1);
	const end_date_formatted = formatDate(end_date);

	const start_date = new Date();
	start_date.setDate(end_date.getDate());
	const start_date_formatted = formatDate(start_date);

	var url =
		neo_url +
		`?start_date=${start_date_formatted}&end_date=${end_date_formatted}&api_key=${KEY}`;

	axios
		.get(url)
		.then(async (response) => {
			console.log("New request!");
			const result = processNEOResponse(response.data);
			const stringifiedResults = result.map((item) => JSON.stringify(item));

			await redis.del("neos");
			await redis.rpush("neos", ...stringifiedResults);
			for (var key in result) {
				insertDataToElastic("neos", result[key]);
			}
			console.log("Neos stored in databases.");
		})
		.catch((error) => {
			console.error(error);
		});
};

const processNEOResponse = function (res) {
	var neos = res.near_earth_objects;
	var result = [];

	// get all neos, original message gives them based on date
	const ordered_neos = [];
	for (var date in neos) {
		for (var idx in neos[date]) {
			ordered_neos.push(neos[date][idx]);
		}
	}

	// get neos in the next 24 hours
	for (var neo_idx in ordered_neos) {
		let neo = ordered_neos[neo_idx];
		let close_approach_data = neo["close_approach_data"]["0"];
		if (isInNext24Hours(close_approach_data["close_approach_date_full"])) {
			result.push({
				name: neo["name"],
				is_potentially_hazardous: neo["is_potentially_hazardous_asteroid"]
				? "Yes"
				: "No",
				approach_date: close_approach_data["close_approach_date_full"],
			});
		}
	}

	result.sort(function (a, b) {
		return new Date(a.date) - new Date(b.date);
	});

	return result;
};

function formatDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function isInNext24Hours(dateTimeString) {
	const targetDate = new Date(dateTimeString);
	const currentDate = new Date();
	const timeDifference = currentDate.getTime() - targetDate.getTime();
	const twentyFourHours = 24 * 60 * 60 * 1000;

	if (timeDifference <= twentyFourHours) {
		return true;
	} else {
		return false;
	}
}

const getVisualSunData = async () => {
	const response = await axios.get(sun_url);
	const $ = cheerio.load(response.data);

	const sunDescription = $("p.object_headline_text").text();
	const sunActivityImageURL = $("div.sun_container img").attr("src");
	const sunPositionURL = $(
		".main_content > div:nth-child(19) > div:nth-child(8) > div:nth-child(1) > a:nth-child(1) > img:nth-child(1)"
	).attr("src");

	const rightAscension = $(
		"div.keyinfobox:nth-child(8) > ar:nth-child(2)"
	).text();

	const declination = $("div.keyinfobox:nth-child(9) > ar:nth-child(2)").text();

	const constellation = $(
		"div.keyinfobox:nth-child(10) > ar:nth-child(2) > a:nth-child(1)"
	).text();

	const magnitude = $("div.keyinfobox:nth-child(11) > ar:nth-child(2)").text();

	const activityImageURL = skylive_url + sunActivityImageURL;
	const positionImageURL = skylive_url + sunPositionURL;

	return {
		sunDescription: sunDescription,
		activityImagePath: activityImageURL,
		positionImagePath: positionImageURL,
		rightAscension: rightAscension,
		declination: declination,
		constellation: constellation,
		magnitude: magnitude,
	}; 
};

const getSunDataForMongo = async() => {
	const userAgentString = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'" 
	try {
		// get flare data
		const referer = "https://www.spaceweatherlive.com/en/solar-activity/solar-flares.html";
		var config = {
			headers: {
				'User-Agent': userAgentString,
				'Referer': referer
			}
		};

		const solarFlaresUrl = "https://www.spaceweatherlive.com/includes/live-data.php?object=solar_flare_3d&lang=EN"
		var response = await axios.get(solarFlaresUrl, config);
		var $ = cheerio.load(response.data.val);

		const currentSolarFlareValue = $("div.Cclass").text();
		const solarFlareClass = currentSolarFlareValue[0];
		const solarFlareValue = parseFloat(currentSolarFlareValue.slice(1)); 
		
		// get sunspots data
		config = {
			headers: {
				'User-Agent': userAgentString,
			}
		};

		const sunspotsUrl = "https://www.spaceweatherlive.com/en/solar-activity.html"
		response = await axios.get(sunspotsUrl, config);
		$ = cheerio.load(response.data);
		const numberOfSunSpots = $("table.mb-0:nth-child(3) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > span:nth-child(1)").text();

		const result = {
			solar_flare_class: solarFlareClass,
			solar_flare_value: solarFlareValue,
			number_of_sun_spots: parseInt(numberOfSunSpots)
		};
		console.log("Result: ", result);
	} catch (error) {
		console.error("Error fetching data: ", error);
	}
}

const updateSunData = () => {
	console.log("Updating sun data");
	getVisualSunData ()
		.then(async (data) => {
			await redis.set("sun_forcast", JSON.stringify(data));
			console.log("Sun data updated successfuly!");
		})
		.catch((error) => {
			console.error("Failed to add sun data to redis");
		});
};

async function insertDataToElastic(indexName, data) {
	try {
		const response = await client.index({
			index: indexName,
			body: data
		});

		await client.indices.refresh({index: indexName})

		console.log('Data inserted!');
	} catch (error) {
		console.error('Error inserting data:', error);
	}
}

async function insertDataToMongo(collecetionName, data){
	try{
		await mongoClient.connect()
		const db = mongoClient.db()
		const collection = db.collection(collecetionName)
		const result = await collection.insertOne(data)
		console.log("Data inserted successfully!")
	} catch(err){
		console.log("Insertion Failed!", err)
	}
}

setInterval(updateSunData, 60_000);
setInterval(scrapNeos, 60_000);
setInterval(getSunDataForMongo, 3000);
