// require("dotenv").config();
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { data: initData } = require("./data.js");
const Listing = require("../models/listing.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MAPTILER_API_KEY = process.env.MAP_API_KEY.trim();

// const Mongo_URL = "mongodb://127.0.0.1:27017/feedinghands";
const dbURL = process.env.MONGO_ATLAS_STRING;

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

async function main() {
    // await mongoose.connect(Mongo_URL);
    await mongoose.connect(dbURL);
}

const geocodeLocation = async (location) => {
    console.log("Using MapTiler API Key:", MAPTILER_API_KEY); // Debugging

    const geocodeUrl = `https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${MAPTILER_API_KEY}`;
    
    try {
        const response = await fetch(geocodeUrl);
        const text = await response.text();

        if (!response.ok) {
            console.error("MapTiler API Error:", text);
            return [0, 0];
        }

        const data = JSON.parse(text);
        return (data.features && data.features.length > 0) ? data.features[0].geometry.coordinates : [0, 0];
    } catch (error) {
        console.error("Geocoding failed:", error);
        return [0, 0];
    }
};

const initDB = async () => {
    await Listing.deleteMany({});
    
    if (!Array.isArray(initData)) {
        console.error("initData is not an array:", initData);
        return;
    }

    const updatedData = await Promise.all(
        initData.map(async (obj) => {
            const coordinates = await geocodeLocation(obj.location);
            return { ...obj, owner: "67c5eca51681583c5f93f28c", coordinates };
        })
    );

    await Listing.insertMany(updatedData);
    console.log("Data initialized with coordinates.");
};

initDB();
