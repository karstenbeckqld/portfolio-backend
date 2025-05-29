// Import dependencies.
const express = require("express");
const router = express.Router();
const Item = require("../models/item");
const Utils = require("../Utils");

// Define the routes.

// GET all portfolio items
// Endpoint: /data)
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

// POST a new portfolio item
// Endpoint: /data/create
// Creates a new portfolio item in the database.
router.post("/create", Utils.authenticateToken, async (req, res) => {

    if (!req.body) {
        console.log("No data in request.");
        return res.status(400).json({
            message: "Empty body received.",
        });
    }

    const {title, link, type, sortKey, description, showcasePath} = req.body;
    console.log('Title from req.body: ', title);

    await Item.findOne({title})
        .then((item) => {
            if (item != null) {
                console.log("Item with title:", item.title, 'already exists.');
                return res.status(400).json({
                    message: "Portfolio item already exists.",
                })
            }
        })
        .catch((error) => {
            console.log('Something went wrong, ', error.message);
        })

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

    await newPortfolioItem
        .save()
        .then((result) => {
            return res.status(200).json(result);
        })
        .catch((err) => {
            return res.status(500).json({
                message: "Portfolio item could not be created.",
                errors: err,
            });
        });
});

// PUT - Update a portfolio item
// Endpoint: /data/update/:id
// Updates a portfolio item as per request.
router.put("/update/:id", Utils.authenticateToken, async (req, res) => {
    console.log("Received tech data type:", typeof req.body.tech);
    console.log("Received tech data value:", req.body.tech);

    let showcaseFileName = null;

    if (!req.params.id) {
        return res.status(400).json({
            message: "No ID parameter provided.",
        });
    }

    if (!req.body) {
        console.log("No data in request.");
        return res.status(400).json({
            message: "Empty body received.",
        });
    }

    const {title, link, type, sortKey, description, showcasePath} = req.body;

    const processedData = await processTechArrayAndFile(req);

    const updatedItem = {
        showcasePath: processedData.fileName,
        title,
        link,
        description,
        tech: processedData.filteredTech,
        type,
        sortKey,
    };

    await updatePortfolioItem(updatedItem);

    async function updatePortfolioItem(update) {
        await Item.findByIdAndUpdate(req.params.id, update, {new: true})
            .then((item) => {
                console.log("Saved item:", item);
                return res.status(200).json(item);
            })
            .catch((err) => {
                const errors = Utils.handleErrors(err);
                return res.status(500).json({
                    message: "Portfolio Item not updated.",
                    errors: errors,
                    error: err,
                });
            });
    }
});

// DELETE - Remove a portfolio item
// Endpoint: /data/:id
// Removes a portfolio item from the database.
router.delete("/:id", Utils.authenticateToken, async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({
            message: "No ID parameter provided.",
        });
    }

    console.log("Received id:", req.params.id);

    const deletedItem = await Item.findById(req.params.id);

    await Item.findByIdAndDelete(req.params.id)
        .then((result) => {
            if (!result) {
                console.log("Portfolio item not found");
                res.status(404).json({
                    message: "Portfolio item not found.",
                });
            } else {
                res.status(204).json(deletedItem);
            }
        })
        .catch((err) => {
            console.log("Cannot delete Portfolio item: ", err);
            res.status(400).json({
                message: "Cannot delete Portfolio item.",
                error: err,
            });
        });
});

// Because the post and put methods both require processing of an attached file and setting the fileName in the
// database, the processTechArrayAndFile method handles this functionality and avoids redundant code.
const processTechArrayAndFile = async (req) => {

    if (!req.file) {
        console.log("No image file uploaded.");
        throw new Error("Image file is required.");
    }

    let fileName = '';
    let filteredTech = [];

    try {
        const techArray = JSON.parse(req.body.tech || "[]");
        console.log("Parsed technologies array:", techArray);
        filteredTech = techArray.filter((item) => item && item.trim() !== "");
    } catch (err) {
        console.error("Error parsing tech array:", err);
        throw new Error("Invalid tech array format.");
    }

    try {
        fileName = await Utils.processImage(req.file.filename, 250, 250);
        console.log("Saved file name:", fileName);
    } catch (err) {
        console.error("Error processing image:", err);
        throw new Error("Failed to process image.");
    }

    return {
        fileName,
        filteredTech,
    };
}

module.exports = router;
