require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;

const app = express();
app.use('*', cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    app.listen(port, () => {
        console.log(`Connected to database and server is running on port: ${port}`);
    });
}).catch((err) => {
    console.log('Database connection failed', err);
});

const dataRouter = require('./routes/data');
app.use('/data', dataRouter);
