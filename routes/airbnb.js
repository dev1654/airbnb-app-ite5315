/*******************************
 * ITE5315 – Assignment 4
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: ______ Student ID: ______ Date: ______
 *
 ********************************/

const express = require("express");
const router = express.Router();
const controller = require("../controllers/airbnbController");

// API Routes (for Postman testing)
router.get("/api/airbnbs", controller.getAll);
router.get("/api/airbnbs/:id", controller.getOne);
router.post("/api/airbnbs", controller.create);
router.put("/api/airbnbs/:id", controller.update);
router.delete("/api/airbnbs/:id", controller.remove);

// HTML Routes (for browser UI)
router.get("/", controller.getAllView);
router.get("/create", controller.createView);
router.post("/create", controller.createProcess);
router.get("/:id", controller.getOneView);

module.exports = router;