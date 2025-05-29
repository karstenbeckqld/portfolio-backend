// Import dependencies.
require('dotenv').config();
const User = require('./../models/user');
const express = require('express');
const router = express.Router();
const Utils = require('./../Utils');

// POST - Signin a user
// Endpoint: /auth/signin
// Logs in a user that's been registered in the database.
router.post('/signin', async (req, res) => {

    console.log('From auth.js: ', req.body);

    // First, we check if the request body contains an email and password. If not, or only one got provided, we return
    // and attach a message to the response.
    if (!req.body.email || !req.body.password) {
        console.log('Email or password empty');
        return res.status(400).json({
            message: 'Please provide an email and password.'
        });
    }

    // Define an object that holds the values from the request body.
    const {email, password} = req.body;

    // The function retrieves the email and password from the request body and uses the login function inside the user
    // model to verify the login. If the login is successful, it creates a JWT token. For convenience, we send this
    // token, together with the user information back in the response.
    await User.login(email, password)
        .then((user) => {
            if (user == null) {
                return res.status(400).json({message: 'User not found'});
            }

            const tokenPayload = {
                _id: user._id,
            };

            // console.log(tokenPayload);
            const token = Utils.createToken(tokenPayload);

            // Remove password from userObject
            tokenPayload.password = undefined;
            user.password = '';
            console.log(user);

            // Once the token is generated, we return a response with the user object and the token, so that we can
            // verify a successful login in Postman. The front end can then use this token to verify logged-in users.
            return res.json({
                user: user,
                accessToken: token
            });
        })

        // If an error occurs, the user could not get verified, and we return an errors json object displaying the
        // produced errors, plus a 400 status code. In the front end, this will redirect back to the login form
        // and display errors accordingly.
        .catch((err) => {
            console.log('Cannot log in user: ' + err.message);
            const errors = Utils.handleErrors(err);
            res.status(400).json({
                message: 'Username or password invalid.',
                errors: errors
            });
        });
});

module.exports = router;