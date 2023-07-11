const axios = require('axios')

const minutes = 0.1
const intervalTime = 60 * 1000 * minutes
const twentyFourHoursTimeInMS = 24 * 60 * 60 * 1000

const url = "https://ssd-api.jpl.nasa.gov/cad.api";

const scrapNEO = async function () {
  const response = await axios.get(url);
  neo_list = processNEOResponse(response.data);
  return neo_list; 
}

const processNEOResponse = function (res, neo_list) {
  let neo_data = res.data;
  var neo_list = [];
  
  for (var neo in neo_data) {
    const currentDate = Date.now();
    const neo_date = Date.parse(neo_data[neo][3]);
    if (neo_date - currentDate < twentyFourHoursTimeInMS) {
      neo_list.push(neo_data[neo]);
    }
  }
  // sendToKafka(neo_list);
  return neo_list;
}

const sendToKafka = function (neos) {
  console.log(neos);
}


module.exports = {scrapNEO};
