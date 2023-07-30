const {REDIS_CONFIG} = require("./config");
const {createClient} = require("redis");
let client = createClient(REDIS_CONFIG);

client.on('error', err => console.log('Redis Client Error', err));

client.connect();

const DEFAULT_TTL_SECS = 8*60*60;
const CACHE_TAG = 'ML';

const getKey =  (suffix) => {
    return `CACHE::${CACHE_TAG}::` + suffix
}

module.exports = {
    getKey: getKey,
    getCached: async (req, res, next) => {
        const key = getKey(JSON.stringify([req.path, req.query]));
        console.log(key);
        const c =  await client.get(key);
        if(c){
            console.log("Got from cache.");
            res.json(JSON.parse(c));
        } else{
            try{
                next();
            }catch {}
        }
    },
    caching: async (key, data) => {
        await client.set(key, JSON.stringify(data), {'EX':DEFAULT_TTL_SECS})
    },
    delCache: async (key) => {
        await client.del(key)
    }
}