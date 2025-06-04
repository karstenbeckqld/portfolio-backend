// Import dependencies.
const express = require("express");
const router = express.Router();
const Item = require("../models/item");
const Utils = require("../Utils");
const AWS = require("aws-sdk");

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Define the routes.

// GET all portfolio items
// Endpoint: /data
// This endpoint returns all available portfolio items.
router.get("/", async (req, res) => {
    await Item.find()
        .sort({sortKey: 1})
        .then((items) => {
            res.status(200).json(items);
            //console.log(items);
        })
        .catch((err) => {
            console.log("Cannot get data: ", err);
            res.status(400).json({
                message: "Cannot get data.",
                error: err,
            });
        });
});

// GET for administrative purposes
// Endpoint: /data/auth
// This endpoint returns the current portfolio data but performs a token validation to check if the user is still
// authorised.
router.get("/auth", Utils.authenticateToken, async (req, res) => {
    await Item.find()
        .sort({sortKey: 1})
        .then((items) => {
            res.status(200).json(items);
            //console.log(items);
        })
        .catch((err) => {
            console.log("Cannot get data: ", err);
            res.status(400).json({
                message: "Cannot get data.",
                error: err,
            });
        });
})

// POST a new portfolio item
// Endpoint: /data/create
// Creates a new portfolio item in the database.
router.post("/create", Utils.authenticateToken, async (req, res) => {

    try {
        console.log("POST /data/create received:", req.body, req.file);
        if (!req.body) {
            return res.status(400).json({message: "Empty body received"});
        }

        const {title, link, type, sortKey, description} = req.body;

        const existingItem = await Item.findOne({title});
        if (existingItem) {
            return res.status(400).json({message: "Portfolio item already exists"});
        }

        const processedData = await processTechArrayAndFile(req);

        const newPortfolioItem = new Item({
            showcasePath: processedData.fileName,
            title,
            link,
            description,
            tech: processedData.filteredTech,
            type,
            sortKey,
        });

        const savedItem = await newPortfolioItem.save();
        res.status(200).json(savedItem);
    } catch (err) {
        console.error("Error creating portfolio item:", err);
        res.status(500).json({message: "Portfolio item could not be created", error: err.message});
    }
});

// PUT - Update a portfolio item
// Endpoint: /data/update/:id
// Updates a portfolio item as per request.
router.put("/update/:id", Utils.authenticateToken, async (req, res) => {

    try {
        if (!req.params.id) {
            return res.status(400).json({message: "No ID parameter provided"});
        }
        if (!req.body) {
            return res.status(400).json({message: "Empty body"});
        }

        const {title, link, type, sortKey, description} = req.body;
        const processedData = await processTechArrayAndFile(req);

        const updatedItem = {
            showcasePath: processedData.fileName,
            title,
            link,
            description,
            type,
            sortKey,
            tech: processedData.filteredTech,
        };

        const item = await Item.findByIdAndUpdate(req.params.id, updatedItem, {new: true});
        if (!item) {
            return res.status(404).json({message: "Portfolio item not found"});
        }
        res.status(200).json(item);
    } catch (err) {
        console.error("Error updating portfolio item:", err);
        res.status(500).json({message: "Portfolio item not updated", error: err.message});
    }
});

// DELETE - Remove a portfolio item
// Endpoint: /data/:id
// Removes a portfolio item from the database.
router.delete("/:id", Utils.authenticateToken, async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({message: "No ID parameter provided"});
        }

        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({message: "Portfolio item not found"});
        }

        // Extract S3 Object from showcasePath
        const showcasePath = item.showcasePath;
        if (showcasePath) {
            const url = new URL(showcasePath);
            const key = decodeURIComponent(url.pathname.substring(1));

            console.log('Deleting S3 object: ', key);

            //Delete image from S3
            await s3
                .deleteObject({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: key,
                })
                .promise()
                .catch((err) => {
                    console.error('Error deleting S3 object: ', err);
                    throw new Error('Failed to delete image from S3.');
                });
        }

        const deletedItem = await Item.findByIdAndDelete(req.params.id);
        res.status(204).json(deletedItem);
    } catch (err) {
        console.error("Cannot delete portfolio item:", err);
        res.status(400).json({message: "Cannot delete portfolio item", error: err.message});
    }
});

// Because the post and put methods both require processing of an attached file and setting the fileName in the
// database, the processTechArrayAndFile method handles this functionality and avoids redundant code.
const processTechArrayAndFile = async (req) => {

    try {
        let fileName = '';
        let filteredTech = [];

        // Validate image (mandatory)
        if (!req.file || !req.file.location) {
            console.log("No file uploaded:", req.file);
            throw new Error("Image file is required");
        }
        fileName = req.file.location; // S3 URL, e.g., https://kb-portfolio-images.s3.us-east-1.amazonaws.com/1747803440330.jpg
        console.log("S3 image URL:", fileName);

        // Parse tech JSON
        try {
            filteredTech = req.body.tech ? JSON.parse(req.body.tech) : [];
            filteredTech = filteredTech.filter(item => item && item !== '');
            console.log("Filtered technologies array:", filteredTech);
        } catch (err) {
            throw new Error("Invalid tech JSON format");
        }

        return {fileName, filteredTech};
    } catch (err) {
        console.error("Error processing tech array or file:", err);
        throw new Error(err.message);
    }

    // if (!req.file) {
    //     console.log("No image file uploaded.");
    //     throw new Error("Image file is required.");
    // }
    //
    // let fileName = '';
    // let filteredTech = [];
    //
    // try {
    //     const techArray = JSON.parse(req.body.tech || "[]");
    //     console.log("Parsed technologies array:", techArray);
    //     filteredTech = techArray.filter((item) => item && item.trim() !== "");
    // } catch (err) {
    //     console.error("Error parsing tech array:", err);
    //     throw new Error("Invalid tech array format.");
    // }
    //
    // try {
    //     fileName = await Utils.processImage(req.file.filename, 250, 250);
    //     console.log("Saved file name:", fileName);
    // } catch (err) {
    //     console.error("Error processing image:", err);
    //     throw new Error("Failed to process image.");
    // }
    //
    // return {
    //     fileName,
    //     filteredTech,
    // };
}

module.exports = router;
