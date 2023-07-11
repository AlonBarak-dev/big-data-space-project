const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const KEY = "DdYnXnHGhGOgBhdoKoIvo5IyprK7EKfqiZtmKrjo";

const app = express();
const port = 3000;
const neo_url = "https://api.nasa.gov/neo/rest/v1/feed";
// ?start_date=2015-09-07&end_date=2015-09-08&api_key=${KEY}`;
const skylive_url = "https://theskylive.com/";
const sun_url = skylive_url + "sun-info";

app.use(express.static(__dirname + "/public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/neos", (req, res) => {
  const end_date = new Date();
  const end_date_formatted = formatDate(end_date);

  const start_date = new Date();
  start_date.setDate(end_date.getDate() - 6);
  const start_date_formatted = formatDate(start_date);

  var url =
    neo_url +
    `?start_date=${start_date_formatted}&end_date=${end_date_formatted}&api_key=${KEY}`;

  axios
    .get(url)
    .then((response) => {
      console.log("New request!");
      result = processNEOResponse(response.data);
      res.json({ neo_list: result["neo_list"], count: result["count"] });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
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

      const activityImageURL = skylive_url + sunActivityImageURL;
      const positionImageURL = skylive_url + sunPositionURL;

      res.json({
        sunDescription: sunDescription,
        activityImagePath: activityImageURL,
        positionImagePath: positionImageURL,
      });
    })
    .catch((error) => {
      // Handle any errors that occurred during the request
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

const processNEOResponse = function (res) {
  var neos = res.near_earth_objects;
  var result = {
    neo_list: [],
    count: {
      labels: [],
      datasets: { label: "Number of NEO's", data: [] },
    },
  };

  // this is for the neos in the last 24 hours (doesnt work quit like it should yet)
  const today_date = new Date();
  const today_date_formatted = formatDate(today_date);

  for (var neo_idx in neos[today_date_formatted]) {
    let neo = neos[today_date_formatted][neo_idx];
    let close_approach_data = neo["close_approach_data"]["0"];
    result["neo_list"].push({
      name: neo["name"],
      is_potentially_hazardous: neo["is_potentially_hazardous_asteroid"]
        ? "Yes"
        : "No",
      approach_date: close_approach_data["close_approach_date_full"],
    });
  }

  // count neos for each day
  var date_count_pairs = [];
  for (var date in neos) {
    count = 0;
    for (idx in neos[date]) {
      count++;
    }
    date_count_pairs.push({ date: date, count: count });
  }

  date_count_pairs.sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });

  for (var pair_idx in date_count_pairs) {
    var pair = date_count_pairs[pair_idx];
    result["count"]["labels"].push(pair["date"]);
    result["count"]["datasets"]["data"].push(pair["count"]);
  }

  return result;
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
