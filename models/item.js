// This is the models for the data collection in the database.

// Bring in dependencies
const mongoose = require("mongoose");

// Create Data schema
// The schema defines the database fields and their properties.
const itemSchema = new mongoose.Schema({
    showcasePath: {
        type: String,
        required: true
    },
    imagePaths: {
        type: Array,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tech: {
        type: Array
    },
    type: {
        type: String,
        required: true
    },
    sortKey: {
        type: Number
    }
}, {timestamps: true});

module.exports = mongoose.model("Item", itemSchema);