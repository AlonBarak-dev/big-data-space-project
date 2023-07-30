var mongo =  require('mongodb');
var config = require('../config');

const client = new mongo.MongoClient(config.MONGO_CONN_STRING);
const database = client.db(config.MONGO_DB);

class ValueError implements Error {
}

const MongoService = {
    getDataset: async (from, to) => {
        if(!from || !to){
            throw new ValueError("from or to are missing");
        }

        const pipeline = [
            {$match: {dt: {$gte: from, $lte: to}}},
            {$set: {
                cloud_count: "$clouds.all",
                temp: "$main.temp",
                grnd_level: "$main.grnd_level",
                humidity: "$main.humidity",
                pressure: "$main.pressure",
            },
        },
            {
                $addFields: {
                    dt_snap: {
                        $subtract: ["$dt", {
                            $mod: ["$dt", 60*1000]
                        }]
                    },
                },
            },
            {
                $lookup: {
                    from: "solar_flares",
                    localField: "dt_snap",
                    foreignField: "date",
                    as: "sun_radiation"
                },
            },
            {
                $unwind: "$sun_radiation"
            },
            {
                $addFields: {
                    sun_rad_level: {$multiply: ["$sun_radiation.value", 100000]},
                },
            }
        ];
        console.log(JSON.stringify(pipeline));


        const aggCursor = await database.collection('open-weather').aggregate(pipeline);

        return await aggCursor;
    },


}
module.exports = {MongoService}