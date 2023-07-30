let redis = require('redis');
const {REDIS_HOST} = require("./config");
const {createClient} = require("redis");
let client = createClient({
    url: `redis://${REDIS_HOST}:6379`
});

client.on('error', err => console.log('Redis Client Error', err));

client.connect();

const getKey =  (suffix) => {
    return "CACHE::ML::" + suffix
}
module.exports = {
    getKey: getKey,
    getCached: async (req, res, next) => {
        const key = getKey(JSON.stringify([req.path, req.query]));
        console.log(key);
        const c =  await client.get(key);
        if(c){
            res.json(JSON.parse(c));
        } else{
            try{
                next();

            }catch {

            }
        }

    },
    caching: async (key, data) => {
        await client.set(key, JSON.stringify(data))
    },
    delCache: async (key) => {
        await client.del(key)
    }
}