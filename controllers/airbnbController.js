/*******************************
 * ITE5315 – Assignment 4
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: ______ Student ID: ______ Date: ______
 *
 ********************************/

const Airbnb = require("../models/airbnb");

// GET ALL - API
exports.getAll = async (req, res, next) => {
  try {
    const { 
      minPrice, 
      maxPrice, 
      room_type, 
      neighbourhood,
      neighbourhood_group,
      search,
      sortBy = "price", 
      page = 1, 
      limit = 12 
    } = req.query;

    const filter = {};

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (room_type) filter.room_type = room_type;
    if (neighbourhood) filter.neighbourhood = neighbourhood;
    if (neighbourhood_group) filter.neighbourhood_group = neighbourhood_group;

    if (search) {
      filter.$or = [
        { NAME: { $regex: search, $options: "i" } },
        { neighbourhood: { $regex: search, $options: "i" } },
        { host_name: { $regex: search, $options: "i" } }
      ];
    }

    const sortOptions = {};
    if (sortBy) {
      if (sortBy === 'price_low') sortOptions.price = 1;
      else if (sortBy === 'price_high') sortOptions.price = -1;
      else if (sortBy === 'rating') sortOptions.review_rate_number = -1;
      else if (sortBy === 'reviews') sortOptions.number_of_reviews = -1;
      else sortOptions[sortBy] = 1;
    }

    const airbnbs = await Airbnb.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Airbnb.countDocuments(filter);

    res.status(200).json({ 
      page: Number(page), 
      limit: Number(limit), 
      total,
      count: airbnbs.length, 
      data: airbnbs 
    });
  } catch (err) {
    next(err);
  }
};

// GET ALL - HTML RENDER
exports.getAllView = async (req, res, next) => {
  try {
    const { 
      minPrice, 
      maxPrice, 
      room_type, 
      neighbourhood,
      neighbourhood_group,
      search,
      sortBy = "price",
      page = 1, 
      limit = 12 
    } = req.query;

    const filter = {};

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (room_type) filter.room_type = room_type;
    if (neighbourhood) filter.neighbourhood = neighbourhood;
    if (neighbourhood_group) filter.neighbourhood_group = neighbourhood_group;

    if (search) {
      filter.$or = [
        { NAME: { $regex: search, $options: "i" } },
        { neighbourhood: { $regex: search, $options: "i" } },
        { host_name: { $regex: search, $options: "i" } }
      ];
    }

    const sortOptions = {};
    if (sortBy) {
      if (sortBy === 'price_low') sortOptions.price = 1;
      else if (sortBy === 'price_high') sortOptions.price = -1;
      else if (sortBy === 'rating') sortOptions.review_rate_number = -1;
      else if (sortBy === 'reviews') sortOptions.number_of_reviews = -1;
      else sortOptions[sortBy] = 1;
    }

    const airbnbs = await Airbnb.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Airbnb.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get unique values for filters
    const neighbourhoods = await Airbnb.distinct('neighbourhood');
    const neighbourhoodGroups = await Airbnb.distinct('neighbourhood_group');
    const roomTypes = await Airbnb.distinct('room_type');

    res.render("index", {
      title: "AirBnB Listings",
      airbnbs,
      currentPage: Number(page),
      totalPages,
      total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: Number(page) + 1,
      prevPage: Number(page) - 1,
      filters: { minPrice, maxPrice, room_type, neighbourhood, neighbourhood_group, search, sortBy },
      neighbourhoods: neighbourhoods.filter(n => n),
      neighbourhoodGroups: neighbourhoodGroups.filter(ng => ng),
      roomTypes: roomTypes.filter(rt => rt)
    });
  } catch (err) {
    next(err);
  }
};

// GET ONE - API
exports.getOne = async (req, res, next) => {
  try {
    const airbnb = await Airbnb.findOne({ 
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ]
    }).lean();
    
    if (!airbnb) return res.status(404).json({ message: "AirBnB listing not found" });
    res.json(airbnb);
  } catch (err) {
    next(err);
  }
};

// GET ONE - HTML RENDER
exports.getOneView = async (req, res, next) => {
  try {
    const airbnb = await Airbnb.findOne({ 
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ]
    }).lean();
    
    if (!airbnb) return res.status(404).render("error", { message: "AirBnB listing not found" });
    
    // Get similar listings
    const similarListings = await Airbnb.find({
      _id: { $ne: airbnb._id },
      neighbourhood: airbnb.neighbourhood,
      room_type: airbnb.room_type
    }).limit(4).lean();

    res.render("details", { 
      title: airbnb.NAME, 
      airbnb,
      similarListings
    });
  } catch (err) {
    next(err);
  }
};

// SEARCH BY NAME - HTML RENDER
exports.searchByName = async (req, res, next) => {
  try {
    const { name } = req.body;
    const airbnbs = await Airbnb.find({ 
      NAME: { $regex: name, $options: "i" } 
    }).limit(50).lean();
    
    res.render("search-results", { 
      title: `Search Results for "${name}"`,
      airbnbs,
      searchTerm: name
    });
  } catch (err) {
    next(err);
  }
};

// CREATE - API (for Postman)
exports.create = async (req, res, next) => {
  try {
    const airbnb = await Airbnb.create(req.body);
    res.status(201).json(airbnb);
  } catch (err) {
    next(err);
  }
};

// CREATE - HTML RENDER
exports.createView = (req, res) => {
  res.render("create", { title: "Add New Listing" });
};

// CREATE - PROCESS FORM
exports.createProcess = async (req, res, next) => {
  try {
    // Generate a unique ID if not provided
    if (!req.body.id) {
      req.body.id = `gen-${Date.now()}`;
    }
    
    await Airbnb.create(req.body);
    res.redirect("/");
  } catch (err) {
    next(err);
  }
};

// UPDATE - API (for Postman)
exports.update = async (req, res, next) => {
  try {
    const airbnb = await Airbnb.findOneAndUpdate(
      { 
        $or: [
          { _id: req.params.id },
          { id: req.params.id }
        ]
      },
      req.body,
      { new: true, runValidators: true }
    );
    if (!airbnb) return res.status(404).json({ message: "AirBnB listing not found" });
    res.json(airbnb);
  } catch (err) {
    next(err);
  }
};

// DELETE - API (for Postman)
exports.remove = async (req, res, next) => {
  try {
    const airbnb = await Airbnb.findOneAndDelete({ 
      $or: [
        { _id: req.params.id },
        { id: req.params.id }
      ]
    });
    if (!airbnb) return res.status(404).json({ message: "Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};