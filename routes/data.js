// Import dependencies.
const express = require('express');
const router = express.Router();
const Item = require('../models/item');

// Define the routes.
router.get('/', async (req, res) => {
    await Item.find().sort({sortKey: 1})
        .then((items) => {
            res.status(200).json(items);
        })
        .catch((err) => {
            console.log('Cannot get data: ', err);
            res.status(400).json({
                message: 'Cannot get data.',
                error: err
            });
        });
});

module.exports = router;