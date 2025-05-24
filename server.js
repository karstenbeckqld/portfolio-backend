require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const port = process.env.PORT || 3000;

const multer = require('multer');
const multerStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/images');
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({storage: multerStorage});

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

const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

const userRouter = require('./routes/user');
app.use('/user', userRouter);
