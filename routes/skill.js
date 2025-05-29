// Import dependencies.
const express = require("express");
const router = express.Router();
const Skill = require("../models/skill");

router.get('/', async (req, res) => {
    await Skill.find()
        .then((data) => {
            res.status(200).json(data)
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({
                message: 'Cannot get skills',
                error: err.message,
            })
        });
})

router.post('/', async (req, res) => {
    if (!req.body) {
        console.log("No data in request.");
        return res.status(400).json({
            message: "Empty body received.",
        });
    }

    const {name, level} = req.body;

    await Skill.findOne({name: req.body.name})
        .then((data) => {
            if (data != null) {
                console.log("Skill with name:", data.name, 'already exists.');
                return res.status(400).json({
                    message: 'Skill already exists'
                })
            }
        })
        .catch((err) => {
            console.log('Something went wrong: ', err.message);
        })

    const newSkillItem = new Skill({
        name,
        level,
    })

    await newSkillItem
        .save()
        .then((result) => {
            return res.status(200).json(result);
        })
        .catch((err) => {
            return res.status(500).json({
                message: "Skill could not be created.",
                errors: err,
            });
        });
})

router.put("/:id", async (req, res) => {
    if (req.params.id == null) {
        console.log("No id provided in request.");
        return res.status(400).json({
            message: "No id parameter received.",
        })
    }

    if (!req.body) {
        console.log("No data in request.");
        return res.status(400).json({
            message: "Empty body received.",
        });
    }

    const {name, level} = req.body;

    const updatedSkill = {
        name,
        level,
    }

    await Skill.findByIdAndUpdate(req.params.id, updatedSkill, {new: true})
        .then((result) => {
            return res.status(200).json(result);
        })
        .catch((err) => {
            return res.status(500).json({
                message: 'Something went wrong: ',
                errors: err.message,
            })
        })
})

router.delete("/:id", async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({
            message: "No ID parameter provided.",
        });
    }

    await Skill.findByIdAndDelete(req.params.id)
        .then((result) => {
            if (!result) {
                console.log("Skill not found");
                res.status(404).json({
                    message: "Skill not found.",
                });
            } else {
                res.status(200).json({
                    message: "Skill Item deleted.",
                });
            }
        })
        .catch((err) => {
            console.log("Cannot delete Skill: ", err);
            res.status(400).json({
                message: "Cannot delete Skill.",
                error: err,
            });
        });
})

module.exports = router;