// Import dependencies.
const express = require("express");
const router = express.Router();
const Item = require("../models/item");
const Utils = require("../Utils");

// Define the routes.
router.get("/", async (req, res) => {
  await Item.find()
    .sort({ sortKey: 1 })
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

// Update a portfolio item (route: /data/update/:id)
router.put("/update/:id", async (req, res) => {
  console.log("Received tech data type:", typeof req.body.tech);
  console.log("Received tech data value:", req.body.tech);

  let schowcaseFileName = null;

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

  const { title, link, type, sortKey, description, showcasePath } = req.body;

  const techarray = JSON.parse(req.body.tech);
  console.log("Parsed techarray: ", techarray);
  let filteredTech = techarray.filter(function (ingredient) {
    return ingredient.trim() !== "";
  });

  if (req.file) {
    schowcaseFileName = await Utils.processImage(req.file.filename, 250, 250);
  } else {
    schowcaseFileName = showcasePath || null;
  }

  console.log("ShowcaseFileName: ", schowcaseFileName);

  const updatedItem = {
    showcasePath: schowcaseFileName,
    title,
    link,
    description,
    tech: filteredTech,
    type,
    sortKey,
  };

  await updatePortfolioItem(updatedItem);

  async function updatePortfolioItem(update) {
    await Item.findByIdAndUpdate(req.params.id, update, { new: true })
      .then((item) => {
        console.log("Saved item:", item);
        res.status(200).json(item);
      })
      .catch((err) => {
        const errors = Utils.handleErrors(err);
        res.status(500).json({
          message: "Portfolio Item not updated.",
          errors: errors,
          error: err,
        });
      });
  }
});

router.post("/", async (req, res) => {
  let schowcaseFileName = null;
  let dbTitle = "";

  if (!req.body) {
    console.log("No data in request.");
    return res.status(400).json({
      message: "Empty body received.",
    });
  }

  const { title, link, type, sortKey, description, showcasePath } = req.body;
  console.log('Title from req.body: ', title);
  
  try {
    dbTitle = await Item.findOne({ title: title }).exec();
  } catch (e) {
    console.log(e);
  }

  console.log('Title from DB: ', dbTitle);

  if (dbTitle.title === title){
    return res.status(404).json({
        message: 'Portfolioitem already exists.'
    })
  }

  const techarray = JSON.parse(req.body.tech);
  console.log("Parsed techarray: ", techarray);
  let filteredTech = techarray.filter(function (ingredient) {
    return ingredient.trim() !== "";
  });

  if (req.file) {
    schowcaseFileName = await Utils.processImage(req.file.filename, 250, 250);
  } else {
    schowcaseFileName = showcasePath || null;
  }

  console.log("ShowcaseFileName: ", schowcaseFileName);

  const newPortfolioItem = new Item({
    showcasePath: schowcaseFileName,
    title,
    link,
    description,
    tech: filteredTech,
    type,
    sortKey,
  });

  await newPortfolioItem
    .save()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((err) => {
      res.status(500).json({
        message: "Portfolio Item not created.",
        errors: err,
      });
    });
});

router.delete("/:id", async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({
      message: "No ID parameter provided.",
    });
  }

  await Item.findByIdAndDelete(req.params.id)
    .then((result) => {
      // Changed from 'res' to 'result'

      if (!result) {
        console.log("Portfolioitem not found");
        res.status(404).json({
          message: "Portfolioitem not found.",
        });
      } else {
        res.status(200).json({
          message: "Portfolio Item deleted.",
        });
      }
    })
    .catch((err) => {
      console.log("Cannot delete Portfolioitem: ", err);
      res.status(400).json({
        message: "Cannot delete Portfolioitem.",
        error: err,
      });
    });
});

module.exports = router;
