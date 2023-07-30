const ELASTIC_CONFIG = {
    node: `http://35.234.119.103:9200`,
    auth: {
        username: 'elastic',
        password: 'changeme',
    }}

const REDIS_CONN = "redis://35.234.119.103:6379";

const REDIS_CONFIG = {
    url: REDIS_CONN
}

const MONGO_CONN = 'mongodb+srv://big-data-space:Aa123456@big-data-space.wlxmqwy.mongodb.net/?retryWrites=true&w=majority' // MongoDB

const simIndexName = 'raw_simulator_events'; // Elastic search - index name for simulator events
const neoIndexName = 'neos'


module.exports = {ELASTIC_CONFIG, REDIS_CONFIG, MONGO_CONN, simIndexName, neoIndexName}