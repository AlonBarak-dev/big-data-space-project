const express = require("express");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");

const KEY = "DdYnXnHGhGOgBhdoKoIvo5IyprK7EKfqiZtmKrjo";

const app = express();
const port = 3000;
const neo_url = "https://api.nasa.gov/neo/rest/v1/feed";
const skylive_url = "https://theskylive.com/";
const sun_url = skylive_url + "sun-info";
const eventList = [];

app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/get_neos", (req, res) => {
  const end_date = new Date();
  end_date.setDate(end_date.getDate() + 1);
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

app.get("/get_event_list", (req, res) => {
  res.json({ events: eventList });
});

app.post("/simdata", (req, res) => {
  const { Date, notfac, loc, type, urg } = req.body;
  const newEvent = {
    date: Date,
    notfac: notfac,
    location: loc,
    type: type,
    urgancy: urg,
  };
  eventList.push(newEvent);

  console.log("Received Message: ~~~~~~~~~~~~~~~~");
  console.log("Date: ", Date);
  console.log("Notifing factor: ", notfac);
  console.log("Location: ", loc);
  console.log("Type of event: ", type);
  console.log("Urgency Level: ", urg);
  res.sendStatus(200);
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
      result["neo_list"].push({
        name: neo["name"],
        is_potentially_hazardous: neo["is_potentially_hazardous_asteroid"]
          ? "Yes"
          : "No",
        approach_date: close_approach_data["close_approach_date_full"],
      });
    }
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
