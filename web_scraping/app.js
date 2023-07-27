const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const Redis = require("ioredis");

const KEY = "DdYnXnHGhGOgBhdoKoIvo5IyprK7EKfqiZtmKrjo";

const app = express();
const redis = new Redis();

const port = 3333;
const neo_url = "https://api.nasa.gov/neo/rest/v1/feed";
const skylive_url = "https://theskylive.com/";
const sun_url = skylive_url + "sun-info";

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
      console.log("Neos stored in Redis.");
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

const getSunData = async () => {
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

const updateSunData = () => {
  console.log("Updating sun data");
  getSunData()
    .then(async (data) => {
      await redis.set("sun_forcast", JSON.stringify(data));
      console.log("Sun data updated successfuly!");
    })
    .catch((error) => {
      console.error("Failed to add sun data to redis");
    });
};

setInterval(updateSunData, 60_000);
setInterval(scrapNeos, 60_000);
