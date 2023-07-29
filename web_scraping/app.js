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

const getSunDataForMongo = () => {
	const userAgentString = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'" 
	const referer = "https://www.spaceweatherlive.com/en/solar-activity/solar-flares.html";
	const config = {
		headers: {
			'User-Agent': userAgentString,
			'Referer': referer
		}
	};

	const shortConfig = {
		headers: {
			'User-Agent': userAgentString,
		}
	};

	const imagesConfig = {
		headers: {
			'User-Agent': userAgentString,
		},
		responseType: "arraybuffer"
	};

	try {
		const solarFlareData = getFlareData(config);
		const nSunSpots = getNumberOfSunSpots(shortConfig);
		const cmesList = getCmesList(shortConfig);
		const images = getImageUrls(imagesConfig);	
		const sunspotRegionList = getSunspotRegions(shortConfig);
		const forcastText = getSunForcastString(config);

		const promises = [solarFlareData, nSunSpots, images, cmesList, sunspotRegionList, forcastText];
		return Promise.all(promises).then((values) => {;
			// construct result
			const result = {
				solar_flare_data: values[0],
				number_of_sun_spots: values[1],
				images: values[2],
				cmes_list: values[3],
				sunspot_regions: values[4],
				sun_forcast_string: values[5],
			};
			
			console.log("Scraping success!");
			return result;
		});
	} catch (error) {
		console.error("Error fetching data: ", error);
	}
}

const getFlareData = async(config) => {
	const solarFlaresUrl = "https://www.spaceweatherlive.com/includes/live-data.php?object=solar_flare_3d&lang=EN"
	const response = await axios.get(solarFlaresUrl, config);

	const tableData = response.data[0]["data"];
	const flareEventsList = []; 
	for (var entry in tableData) {
		flareEventsList.push({
			date: tableData[entry][0],
			value: tableData[entry][1]
		});
	}
	
	return flareEventsList;
};

const getCmesList = async(config) => {
	// get cmes list
	const cmesUrl = "https://www.spaceweatherlive.com/en/solar-activity/latest-cmes.html";
	const response = await axios.get(cmesUrl, config);
	const $ = cheerio.load(response.data);
	const cmesTableData = $("table.text-center > tbody:nth-child(2)").children();
	const nRows = cmesTableData.length;
	var fields = ["CME #", "Onset time", "Duration", "Angle", "Angular width", "Medain", "Varitaion", "Min", "Max", "Halo?"];
	const cmesListResult = [];
	console.log("number of rows: ", nRows);

	for (let i = 0; i < nRows; i++) {
		const rowData = $(`table.text-center > tbody:nth-child(2) > tr:nth-child(${i + 1})`).children();
		const rowLength = rowData.length - 3; // -3 because i want to ignore the last three columns
		const cmesEntry = {};
		for (let j = 0; j < rowLength; j++) { 
			const cellData = $(`table.text-center > tbody:nth-child(2) > tr:nth-child(${i + 1}) > td:nth-child(${j + 1})`).text();
			cmesEntry[fields[j]] = cellData;
		}
		cmesListResult.push(cmesEntry);
	}
	
	return cmesListResult;
};

const getSunspotRegions = async(config) => {
	// get sunspot regions
	const sunspotRegionsUrl = "https://www.spaceweatherlive.com/en/solar-activity/sunspot-regions.html";
	const response = await axios.get(sunspotRegionsUrl, config);
	const $ = cheerio.load(response.data);
	const regionsTableData = $("div.row:nth-child(10) > div:nth-child(2) > div:nth-child(1) > table:nth-child(2) > tbody:nth-child(2)").children();
	const nEntries = regionsTableData.length;
	fields = ["Region", "Number of Sunspots", "Class Magnitude", "Class Spot"];
	const sunspotRegionList = [];
	for (let i = 0; i < nEntries; i++) {
		let entry = $(`div.row:nth-child(10) > div:nth-child(2) > div:nth-child(1) > table:nth-child(2) > tbody:nth-child(2) > tr:nth-child(${i + 1})`).children();

		const regionEntry = {}
		for (let j = 0; j < entry.length; j++) {
			var data;
			if (j == 2) {
				data = $(`div.row:nth-child(10) > div:nth-child(2) > div:nth-child(1) > table:nth-child(2) > tbody:nth-child(2) > tr:nth-child(${i + 1}) > td:nth-child(${j + 1}) > i:nth-child(1)`).attr("class");

				data = data === "region_mag A" ? "A" : "B"; 
			} else {
				data = $(`div.row:nth-child(10) > div:nth-child(2) > div:nth-child(1) > table:nth-child(2) > tbody:nth-child(2) > tr:nth-child(${i + 1}) > td:nth-child(${j + 1})`).text();
			}

			regionEntry[fields[j]] = data;
		}

		sunspotRegionList.push(regionEntry);
	}

	return sunspotRegionList; 
}; 

const getImageUrls = async(config) => {
	const sunspotsImageUrl = "https://www.spaceweatherlive.com/images/SDO/SDO_HMIIF_512.jpg";
	const solarFlaresImageUrl = "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0131.jpg";
	
	const sunspotImageResponse = await axios.get(sunspotsImageUrl, config);
	const sunspotImageData = sunspotImageResponse.data;

	const solarFlareResponse = await axios.get(solarFlaresImageUrl, config);
	const solarFlareData = solarFlareResponse.data;

	const images = {
		sunspots: sunspotImageData,
		solar_falres: solarFlareData,
	};

	return images;
};

const getNumberOfSunSpots = async(config) => {
	const sunspotsUrl = "https://www.spaceweatherlive.com/en/solar-activity.html";
	const response = await axios.get(sunspotsUrl, config);
	const $ = cheerio.load(response.data);
	const nSunSpots = $("table.mb-0:nth-child(3) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > span:nth-child(1)").text();

	return parseInt(nSunSpots);
};

const getSunForcastString = async(config) => {
	const url = "https://www.spaceweatherlive.com/en/reports/forecast-discussion.html";
	const response = await axios.get(url, config);
	const $ = cheerio.load(response.data);
	const fullText = $(".col-md-8").text();
	const lines = fullText.split("\n");

	return lines.slice(39, 41).join(); 
}; 

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

const updateSunDataMongo = () => {
	const db_name = "big-data-test";
	getSunDataForMongo()
	.then((data) => {
		const solar_flare_data = data.solar_flare_data;
		const solaFlareList = []
		for (let entry in solar_flare_data) {
			const flareEntryDate = solar_flare_data[entry]["date"];
			const flareEntryValue = solar_flare_data[entry]["value"];
			solaFlareList.push({date: flareEntryDate, value: flareEntryValue});
		}
		insertDataToMongoMany(db_name, "solar_flares", solaFlareList);

		const currentDate = Date.now();
		const nSunSpots = data.number_of_sun_spots;
		const nSunSpotsEntry = {date: currentDate, value: nSunSpots};
		insertDataToMongo(db_name, "n_sunspots", nSunSpotsEntry);

		const sunspotsImageData = data.images.sunspots;
		const solarFlaresImageData = data.images.solar_falres;
		const sunspotsEntry = {date: currentDate, value: sunspotsImageData}
		const solarFlareEntry = {date: currentDate, value: solarFlaresImageData}
		
		insertDataToMongo(db_name, "sunspot_images", sunspotsEntry);
		insertDataToMongo(db_name, "solar_flare_images", solarFlareEntry);
		
		const cmesList = [];
		for (let entryKey in data.cmes_list) {
			const [year, month, day, hours, minutes] = data.cmes_list[entryKey]["Onset time"].split(/[/ :]/);
			const dateObject = new Date(year, month - 1, day, hours, minutes);
			data.cmes_list[entryKey]["Onset time"] = dateObject.getTime();
			cmesList.push(data.cmes_list[entryKey]);
		}
		insertDataToMongoMany(db_name, "cmes", cmesList);
		
		const regoinsList = [];
		for (let regionKey in data.sunspot_regions) {
			const entry = {date: currentDate};
			for (let key in data.sunspot_regions[regionKey]) {
				entry[key] = data.sunspot_regions[regionKey][key];
			}
			regoinsList.push(entry);
		}
		insertDataToMongoMany(db_name, "sunspot_regions", regoinsList);

		const forcastStringEntry = {date: currentDate, value: data.sun_forcast_string};
		insertDataToMongo(db_name, "sun_frocast", forcastStringEntry);	

		console.log("Mongo update done!");
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

async function insertDataToMongo(db_name, collecetionName, data){
	try{
		await mongoClient.connect()
		const db = mongoClient.db(db_name)
		const collection = db.collection(collecetionName)
		const result = await collection.insertOne(data)
		console.log("Data inserted successfully!")
	} catch(err){
		console.log("Insertion Failed!", err)
		console.log("Data: ", data);
	}
}

async function insertDataToMongoMany(db_name, collecetionName, data){
	try{
		await mongoClient.connect()
		const db = mongoClient.db(db_name)
		const collection = db.collection(collecetionName)
		const result = await collection.insertMany(data)
		console.log("Data inserted successfully!")
	} catch(err){
		console.log("Insertion Failed!", err)
		console.log("Data: ", data);
	}
}

setInterval(updateSunData, 60_000);
setInterval(scrapNeos, 60_000);
setInterval(updateSunDataMongo, 3000);
