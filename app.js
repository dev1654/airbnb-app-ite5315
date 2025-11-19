/*******************************
 * ITE5315 – Assignment 4
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: ______ Student ID: ______ Date: ______
 *
 ********************************/

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const hbs = require("hbs");
const config = require("./config/database");

const app = express();

// Check if MongoDB URI is provided
if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// Handlebars configuration
app.set("view engine", "hbs");
app.set("views", __dirname + "/views");

// =============================================
// HANDLEBARS HELPERS
// =============================================

// Equality helper
hbs.registerHelper("eq", function(a, b) {
    return a === b;
});

// Truncate text helper
hbs.registerHelper("truncate", function(str, length) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + "...";
});

// Format currency helper
hbs.registerHelper("formatCurrency", function(amount) {
    if (!amount) return "0";
    return parseFloat(amount).toFixed(2);
});

// Range helper for pagination
hbs.registerHelper("range", function(start, end) {
    if (start > end) return [];
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
});

// Greater than helper
hbs.registerHelper("gt", function(a, b) {
    return a > b;
});

// Less than helper
hbs.registerHelper("lt", function(a, b) {
    return a < b;
});

// Subtract helper
hbs.registerHelper("subtract", function(a, b) {
    return a - b;
});

// Add helper
hbs.registerHelper("add", function(a, b) {
    return a + b;
});

// Max helper
hbs.registerHelper("max", function(a, b) {
    return Math.max(a, b);
});

// Min helper
hbs.registerHelper("min", function(a, b) {
    return Math.min(a, b);
});

// Format date helper
hbs.registerHelper("formatDate", function(date) {
    if (!date) return "N/A";
    try {
        return new Date(date).toLocaleDateString();
    } catch {
        return "Invalid Date";
    }
});

// Build query string helper for pagination
hbs.registerHelper("queryString", function(filters) {
    if (!filters) return '';
    const params = [];
    
    if (filters.minPrice) params.push(`minPrice=${filters.minPrice}`);
    if (filters.maxPrice) params.push(`maxPrice=${filters.maxPrice}`);
    if (filters.room_type) params.push(`room_type=${filters.room_type}`);
    if (filters.neighbourhood) params.push(`neighbourhood=${filters.neighbourhood}`);
    if (filters.neighbourhood_group) params.push(`neighbourhood_group=${filters.neighbourhood_group}`);
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.sortBy) params.push(`sortBy=${filters.sortBy}`);
    
    return params.join('&');
});

// =============================================
// MIDDLEWARE
// =============================================

// Built-in Express body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// =============================================
// DATABASE CONNECTION
// =============================================

// MongoDB connection with better error handling
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log("MongoDB connected to Atlas");
    console.log("Database:", mongoose.connection.db.databaseName);
})
.catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.log("Application will start, but database operations will fail");
});

const db = mongoose.connection;

// Event logs
db.on("connected", () => console.log("Mongoose connected to DB"));
db.on("error", (err) => console.error("Mongoose error:", err));
db.on("disconnected", () => console.log("Mongoose disconnected"));

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log('\nShutting down gracefully...');
    await mongoose.connection.close();
    console.log('Mongoose disconnected on app termination');
    process.exit(0);
});

// =============================================
// ROUTES
// =============================================

// Load routes
const airbnbRoutes = require("./routes/airbnb");
app.use("/", airbnbRoutes);

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

// 404 handler - must be after all routes
app.use((req, res, next) => {
    if (req.accepts("html")) {
        res.status(404).render("error", { 
            title: "Page Not Found",
            message: "The page you are looking for does not exist." 
        });
    } else {
        res.status(404).json({ message: "Not found" });
    }
});

// Global error handler - must be last
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message);
    
    // Log full error in development
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Mongoose validation errors
    if (err.name === "ValidationError") {
        if (req.accepts("html")) {
            return res.status(400).render("error", {
                title: "Validation Error",
                message: "There was a problem with the data you submitted."
            });
        } else {
            return res.status(400).json({
                message: "Validation Error",
                errors: err.errors
            });
        }
    }

    // Mongoose cast errors (invalid ID)
    if (err.name === "CastError") {
        if (req.accepts("html")) {
            return res.status(400).render("error", {
                title: "Invalid ID",
                message: "The provided ID is not valid."
            });
        } else {
            return res.status(400).json({
                message: "Invalid ID format"
            });
        }
    }

    // MongoDB duplicate key errors
    if (err.code === 11000) {
        if (req.accepts("html")) {
            return res.status(400).render("error", {
                title: "Duplicate Entry",
                message: "This item already exists."
            });
        } else {
            return res.status(400).json({
                message: "Duplicate entry found"
            });
        }
    }

    // Handle HTML vs JSON responses
    if (req.accepts("html")) {
        res.status(500).render("error", { 
            title: "Server Error",
            message: "Something went wrong on our end. Please try again later." 
        });
    } else {
        res.status(500).json({ 
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? err.message : {}
        });
    }
});

// =============================================
// SERVER STARTUP
// =============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\nServer started successfully!`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log(`\nAvailable Routes:`);
    console.log(`   GET  /                    - View all listings`);
    console.log(`   GET  /search              - Search page`);
    console.log(`   GET  /create              - Add new listing form`);
    console.log(`   GET  /:id                 - View listing details`);
    console.log(`   GET  /api/airbnbs         - API: Get all listings`);
    console.log(`   GET  /api/airbnbs/:id     - API: Get single listing`);
    console.log(`   POST /api/airbnbs         - API: Create new listing`);
    console.log(`   PUT  /api/airbnbs/:id     - API: Update listing`);
    console.log(`   DELETE /api/airbnbs/:id   - API: Delete listing`);
    console.log(`\n Ready for Postman testing!`);
});

// Export for testing
module.exports = app;