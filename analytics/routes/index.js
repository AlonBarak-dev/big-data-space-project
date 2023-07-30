var mongo = require("../db/mongo");
var config = require('../config');
var express = require('express');
var router = express.Router();
const axios = require("axios");
const {caching, getKey, getCached} = require("../cache");

const AUTH = "username=gryuri93;api_key=d859eafabf579c56bafd9ff43a46c31cac0a20b5"

/* GET home page. */
const TIMEOUT_SEC = 60;
const DEFAULT_DELAY_MS = 1000;
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "TimeoutError";
    }
}

async function waitForCondition(timeout_ms, delay_ms, f_call, f_should_throw, f_should_ret) {
    const expiry = Date.now() + timeout_ms;
    while (Date.now() < expiry) {
        try {
            const tmp =  await f_call();
            if(!f_should_ret || await f_should_ret(tmp)){
               return tmp
            }
        } catch (e) {
            if (f_should_throw && await f_should_throw(e)) {
                throw e;
            }
            await delay(delay_ms);
        }
    }

    throw new TimeoutError();
}

// TODO: ADD from to filtering
router.get('/', getCached, async function (req, res, next) {
    console.log(req.query);
    const c = await mongo.MongoService.getDataset(new Date(req.query['from']).getTime(), new Date(req.query['to']).getTime());
    if(!c){
        res.json({});
    }

    const created_source = await axios.post(`https://bigml.io/andromeda/source?${AUTH}`, {data: JSON.stringify(await c.toArray())});

    const created_ds = await waitForCondition(TIMEOUT_SEC * 1000,
        DEFAULT_DELAY_MS,
        async () => {
            return await axios.post(`https://bigml.io/andromeda/dataset?${AUTH}`, {source: created_source.data.resource})
        },
        async (e) => {
            return e.response.data.status.code !== -1206
        });

   const created_assoc = await waitForCondition(TIMEOUT_SEC * 1000,
       DEFAULT_DELAY_MS,
       async () => {
          return await axios.post(`https://bigml.io/andromeda/association?${AUTH}`, {
             dataset: created_ds.data.resource,
             input_fields: ["temp", "sun_rad_level"]
          });
       },
       async (e) => {
          return e.response.data.status.code !== -1206
       });


   const assoc_data = await waitForCondition(TIMEOUT_SEC * 1000,
       DEFAULT_DELAY_MS,
       async () => {
          return await axios.get(`https://bigml.io/andromeda/${created_assoc.data.resource}?${AUTH}`);
       },null,
       async (data) => {
          return data.data.status.code === 5
       });

    for (const i of assoc_data.data.associations.items) {
        // if(i.bin_end && i.bin_start === null){
        //     i.desc = `${assoc_data.data.associations.fields[i.field_id].name} <= ${i.bin_end}`
        // }
        // if(i.bin_start && i.bin_end === null){
        //     i.desc = `${assoc_data.data.associations.fields[i.field_id].name} > ${i.bin_start}`
        // }else{
        //i.desc = `${i.bin_start} < ${assoc_data.data.associations.fields[i.field_id].name} <= ${i.bin_end}`
        // }
        i.desc = `${i.bin_start} < ${assoc_data.data.associations.fields[i.field_id].name} <= ${i.bin_end}`
    }

    for (const r of assoc_data.data.associations.rules) {
       r.lhs_desc = `${assoc_data.data.associations.items[r.lhs[0]].desc}`
        r.rhs_desc = `${assoc_data.data.associations.items[r.rhs[0]].desc}`
    }

    await caching(getKey(JSON.stringify([req.path, req.query])), assoc_data.data);
    res.json(assoc_data.data);
});

module.exports = router;
