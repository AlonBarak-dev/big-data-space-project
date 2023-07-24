const Redis = require('ioredis');   // redis

// Create a new Redis instance
const redis = new Redis({
  host: '35.234.119.103', // Redis server host
  port: 6379,        // Redis server port
});


// Function to retrieve all keys and their corresponding values
async function getAllKeysRedis() {
  let cursor = '0';
  const allKeys = [];

  do {
    const [newCursor, keys] = await redis.scan(cursor);
    cursor = newCursor;

    for (const key of keys) {
      const value = await redis.get(key);
      allKeys.push({ key, value });
    }
  } while (cursor !== '0');

  return allKeys;
}

app.get("/get_event_dates", async (req, res) => {
  let results;
  results = await getAllKeysRedis();
  res.json(results);

})