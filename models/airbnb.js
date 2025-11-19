/*******************************
 * ITE5315 – Assignment 4
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: ______ Student ID: ______ Date: ______
 *
 ********************************/

const mongoose = require("mongoose");

const AirbnbSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      sparse: true
    },
    NAME: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      default: 'Unnamed Listing'
    },
    host_id: {
      type: String,
      default: 'Unknown'
    },
    host_identity_verified: {
      type: String,
      default: 'unconfirmed'
    },
    host_name: {
      type: String,
      default: 'Unknown Host'
    },
    neighbourhood_group: {
      type: String,
      default: 'Unknown Area'
    },
    neighbourhood: {
      type: String,
      default: 'Unknown Neighbourhood'
    },
    lat: Number,
    long: Number,
    country: {
      type: String,
      default: 'Unknown'
    },
    country_code: {
      type: String,
      default: 'US'
    },
    instant_bookable: {
      type: String,
      default: 'FALSE'
    },
    cancellation_policy: {
      type: String,
      default: 'moderate'
    },
    room_type: {
      type: String,
      enum: ["Private room", "Entire home/apt", "Shared room", "Hotel room"],
      default: "Private room"
    },
    Construction_year: String,
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    service_fee: {
      type: Number,
      min: 0,
      default: 0
    },
    minimum_nights: {
      type: Number,
      min: 0,
      default: 1
    },
    number_of_reviews: {
      type: Number,
      min: 0,
      default: 0
    },
    last_review: Date,
    reviews_per_month: {
      type: Number,
      min: 0,
      default: 0
    },
    review_rate_number: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    calculated_host_listings_count: {
      type: Number,
      min: 0,
      default: 0
    },
    availability_365: {
      type: Number,
      min: 0,
      max: 365,
      default: 0
    },
    house_rules: {
      type: String,
      default: 'No specific rules'
    },
    license: {
      type: String,
      default: ''
    },
    property_type: {
      type: String,
      default: 'Apartment'
    },
    thumbnail: String,
    images: [{
      type: String
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Add index for better search performance
AirbnbSchema.index({ NAME: 'text', neighbourhood: 'text' });
AirbnbSchema.index({ price: 1 });
AirbnbSchema.index({ room_type: 1 });

module.exports = mongoose.model("Airbnb", AirbnbSchema);