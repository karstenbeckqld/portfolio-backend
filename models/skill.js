
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    level: {
        type: Number,
    }
}, {timestamps: true});

module.exports = mongoose.model('Skill', skillSchema);