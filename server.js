require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const port = process.env.PORT || 3000;

const multer = require('multer');

// Configure multer storage
const multerStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/images');
    },
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

// File filter for images
const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
        callback(null, true);
    } else {
        callback(new Error("File must be an image"), false);
    }
};

// Multer middleware
const upload = multer({
    storage: multerStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

//const upload = multer({storage: multerStorage});

const app = express();
app.use('*', cors());
app.use(express.static('public'));
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
app.use('/data', upload.single('image'), dataRouter);

const skillRouter = require('./routes/skill');
app.use('/skill', skillRouter);

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

const userRouter = require('./routes/user');
app.use('/user', userRouter);
