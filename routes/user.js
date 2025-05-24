/*--------------------------------------------------------------------------------------------------------------------*/
/*--------------------------------------               User Routes               -------------------------------------*/
/*--------------------------------------------------------------------------------------------------------------------*/

/*jshint esversion: 8 */
// To avoid validator errors regarding arrow function syntax, we use the above comment line.

// Import dependencies.
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Utils = require('../Utils');


// As database operations are not carried out on the same server, there might be a slight delay between the request and
// the response. Therefore, we carry out database operations in an asynchronous way. This is why all the following code
// blocks use async and await for operations on the database.

// GET - Get all users -------------------------------------------------------------------------------------------------
// Endpoint: /user
// The get method gets all users from the database with the find() method on the User object. It then returns the users
// from the database as a json object. In case of an error, we return a 400 status code and a json object containing a
// custom message plus the error message from mongoose.
router.get('/', async (req, res) => {
    await User.find()
        .then((users) => {
            res.status(200).json(users);
        })
        .catch((err) => {
            console.log('Cannot get list of users: ', err);
            res.status(400).json({
                message: 'Cannot get users.',
                error: err
            });
        });
});

// GET - Get specific user by id ---------------------------------------------------------------------------------------
// Endpoint: /user/:id
// The below get method looks up a user by a specified ID (/:id route). It uses the mongoose findById() method that
// takes in the database id as parameter. We receive this parameter by using the req.params.id property, which we receive
// from the request. If no user with this id exists, we return a 404 status code (not found) and a json message. If the
// user exists, we return the user object. If there is an error with the request we handle it in the same way as above.
router.get('/:id', async (req, res) => {
    await User.findById(req.params.id)
        .then((user) => {
            if (!user) {
                console.log('User not found');
                res.status(404).json({
                    message: 'User does not exist.'
                });
            } else {
                console.log('User Found');
                res.json(user);
            }
        })
        .catch((err) => {
            console.log('User not found: ', err.message);
            res.status(400).json({
                message: 'Cannot find user.',
                errors: err
            });
        });
});

// POST - Create new User (Receive Form Data from GET('/signup'))----------------------------------------------------------
// Endpoint: /user
// The below post request receives data from the input form and creates a new user.
router.post('/', async (req, res) => {

    // Check if the request body is empty and if yes, return here.
    if (!req.body) {
        return res.status(400).json({
            message: "Empty body received."
        });
    }

    // First we check if the entered email is already in the database and return a response if this is the case. If the
    // entered email doesn't exist, we can continue creating a new user.
    await User.findOne({email: req.body.email})
        .then(async (user) => {

            // If the search returns a user, there's already a user with this email in the database. Hence, we have to
            // return here and send a message in the response.
            if (user != null) {
                console.log('Email already in database.');
                return res.status(400).json({
                    message: 'User email already exists'
                });
            }

            // Create new User object by using the request body content.
            const newUser = new User(req.body);

            // Save the new user to the database
            // Now we save the new newUser to the database with the save() method. If the newUser gets saved successfully, we return
            // the newUser object as json data and set the status to 201.
            await newUser.save()
                .then((user) => {
                    console.log('New user created.');
                    res.status(201).json(user);
                })
                .catch((err) => {
                    // Because the User object defines the email to be unique, mongoose will check for this property and throw an
                    // error, if the entered email already is in the database. This will get caught here and the newUser returned to
                    // the New User dialog with an error message. Here we also check for the right password length and add this
                    // error to the return if it occurs.
                    console.log('User not created.');
                    const errors = Utils.handleErrors(err);
                    res.status(500).json({errors});
                });
        });
});

// PUT - Update user with id -------------------------------------------------------------------------------------------
// Endpoint: /user/:id
// To update a user, we use a put request as these are usually used for updating database entries.
router.put('/:id', Utils.authenticateToken, async (req, res) => {

        console.log('Received data: ', req.body);
        console.log('Received file: ', req.file);


        // Check if the request body is empty and if yes, return here (same as above).
        if (!req.body) {
            console.log('No data in request.');
            return res.status(400).json({
                message: "Empty body received."
            });
        }

        let avatarFileName = null;

        if (req.file) {

            avatarFileName = await Utils.processImage(req.file.filename, 200, 200);

            await updateUser({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                avatar: avatarFileName,
                bio: req.body.bio
            });

        } else {
            await updateUser(req.body);
            console.log('User updated');
        }

        async function updateUser(update) {
            User.findByIdAndUpdate(req.params.id, update, {new: true})
                .then((user) => {
                    res.json(user);
                })
                .catch((err) => {
                    console.log('User not updated.', err.message);
                    const errors = Utils.handleErrors(err);
                    res.status(500).json({
                        message: 'User not updated.',
                        errors: errors,
                        error: err
                    });
                });
        }
    }
);

// DELETE - Delete user with id ----------------------------------------------------------------------------------------
// Endpoint: /user/:id
// To delete a user, we use a delete request as these are often used for database entry deletion.
router.delete('/:id', Utils.authenticateToken, async (req, res) => {

    // Check if ID is missing from the request, if yes, return.
    if (!req.params.id || !req.params || req.params.id === '') {
        console.log('No parameters in request');
        return res.status(400).json({
            message: 'User ID missing from request'
        });
    }

    // Delete the user with given ID from the request.
    // To delete a user, we utilise the findOneAndDelete() method from mongoose that takes in a property for lookup.
    // Technically, we could use more than one property with this method, but the id is sufficient in our case. If the
    // id is found and deleted, we add a message to the response. If an error occurred, we return a status of 500 and
    // add the error plus a custom message to the returned json object.
    // Mongo DB seems to not consider it an error when the code tries to delete a document that doesn't exist. Therefore,
    // we have to add an extra step to check if we received a result from the operation or not.
    await User.findOneAndDelete({_id: req.params.id}, {runValidators: true})
        .then((result) => {
            if (result) {
                // A user with the specified ID was found and deleted
                console.log(`User with ID: ${req.params.id} deleted.`);
                res.json({
                    message: `User with ID: ${req.params.id} deleted.`,
                });
            } else {
                // No user with the specified ID was found
                console.log(`User with ID: ${req.params.id} not found.`);
                res.status(404).json({
                    message: `User with ID: ${req.params.id} not found.`,
                });
            }
        })
        .catch((err) => {

            // Here we handle any errors that occurred and send a response to the browser.
            console.log('User not deleted.', err.message);
            res.status(500).json({
                message: 'User not deleted.',
                error: err
            });
        });
});

// Because the checks in the delete('/:id') request don't work properly with Postman, although they're not
// programmatically wrong, to catch an input trying to delete a user without an id parameter, we've added the below
// route, which returns a response with an appropriate error message.
router.delete('/', Utils.authenticateToken, (req, res) => {
    console.log('No parameters in request');
    return res.status(400).json({
        message: 'User ID missing from request'
    });
});

module.exports = router;