/*******************************
 * ITE5315 – Assignment 4
 * I declare that this assignment is my own work in accordance with Humber Academic Policy.
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students.
 *
 * Name: Dev Khilan Patel Student ID: N01708022 Date: 19/11/2025
 *
 ********************************/

require('dotenv').config();
const mongoose = require('mongoose');
const Airbnb = require('./models/airbnb');
const fs = require('fs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('Connected to MongoDB for data import');
    console.log('Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
});

// Helper function to clean price strings
const cleanPrice = (priceString) => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') return priceString;
    
    // Remove $, commas, and spaces, then convert to number
    const cleaned = priceString.toString().replace(/[$, ]/g, '');
    const price = parseFloat(cleaned);
    
    // If still not a valid number, use 0
    return isNaN(price) ? 0 : price;
};

// Helper function to extract images array
const extractImages = (imagesData) => {
    if (!imagesData) return [];
    
    // If it's already an array of strings, return it
    if (Array.isArray(imagesData) && typeof imagesData[0] === 'string') {
        return imagesData;
    }
    
    // If it's an array of objects with picture_url
    if (Array.isArray(imagesData) && imagesData[0] && imagesData[0].picture_url) {
        return imagesData.map(img => img.picture_url).filter(url => url && url.trim() !== '');
    }
    
    // If it's a single object with picture_url
    if (imagesData && imagesData.picture_url) {
        return [imagesData.picture_url].filter(url => url && url.trim() !== '');
    }
    
    return [];
};

// Helper function to parse date
const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
        return new Date(dateString);
    } catch {
        return null;
    }
};

const importData = async () => {
    try {
        console.log(' Clearing existing data...');
        await Airbnb.deleteMany();
        console.log('Existing data cleared');

        // Read your JSON file
        console.log('Reading JSON data file...');
        let jsonData;
        try {
            const data = fs.readFileSync('./airbnb_data.json', 'utf8');
            jsonData = JSON.parse(data);
            console.log(`Loaded ${jsonData.length} records from JSON file`);
        } catch (fileError) {
            console.error('Error reading JSON file:', fileError.message);
            process.exit(1);
        }

        // Transform data to match your schema
        console.log('Transforming data...');
        const transformedData = jsonData.map((item, index) => {
            // Generate a unique ID if not provided
            const listingId = item.id || `gen-${Date.now()}-${index}`;
            
            // Handle NAME field - use different possible field names
            const name = item.NAME || item.name || item.NAME || `Listing ${index + 1}`;
            
            // Extract and clean images
            const images = extractImages(item.images);
            
            // If no images but thumbnail exists, use thumbnail
            if (images.length === 0 && item.thumbnail) {
                images.push(item.thumbnail);
            }
            
            return {
                id: listingId,
                NAME: name,
                host_id: item['host id'] || item.host_id || item.host_id,
                host_identity_verified: item.host_identity_verified || 'unconfirmed',
                host_name: item['host name'] || item.host_name || 'Unknown Host',
                neighbourhood_group: item['neighbourhood group'] || item.neighbourhood_group || 'Unknown Area',
                neighbourhood: item.neighbourhood || 'Unknown Neighbourhood',
                lat: parseFloat(item.lat) || null,
                long: parseFloat(item.long) || null,
                country: item.country || 'Unknown',
                country_code: item.country_code || 'US',
                instant_bookable: item.instant_bookable || 'FALSE',
                cancellation_policy: item.cancellation_policy || 'moderate',
                room_type: item['room type'] || item.room_type || 'Private room',
                Construction_year: item.Construction_year || '2020',
                price: cleanPrice(item.price),
                service_fee: cleanPrice(item['service fee'] || item.service_fee),
                minimum_nights: parseInt(item['minimum nights'] || item.minimum_nights) || 1,
                number_of_reviews: parseInt(item['number of reviews'] || item.number_of_reviews) || 0,
                last_review: parseDate(item['last review'] || item.last_review),
                reviews_per_month: parseFloat(item['reviews per month'] || item.reviews_per_month) || 0,
                review_rate_number: parseInt(item['review rate number'] || item.review_rate_number) || 0,
                calculated_host_listings_count: parseInt(item['calculated host listings count'] || item.calculated_host_listings_count) || 0,
                availability_365: parseInt(item['availability 365'] || item.availability_365) || 0,
                house_rules: item.house_rules || 'No specific rules',
                license: item.license || '',
                property_type: item.property_type || 'Apartment',
                thumbnail: item.thumbnail || (images.length > 0 ? images[0] : ''),
                images: images,
                isActive: true
            };
        });

        console.log('Starting data import...');
        
        // Insert in smaller batches to handle validation errors
        const batchSize = 25;
        let successfulImports = 0;
        let failedImports = 0;
        
        for (let i = 0; i < transformedData.length; i += batchSize) {
            const batch = transformedData.slice(i, i + batchSize);
            try {
                const result = await Airbnb.insertMany(batch, { ordered: false });
                successfulImports += result.length;
                console.log(`Imported batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedData.length/batchSize)} - ${successfulImports}/${transformedData.length} records`);
            } catch (batchError) {
                // Handle partial failures
                if (batchError.writeErrors) {
                    successfulImports += batchError.writeErrors.length > 0 ? batch.length - batchError.writeErrors.length : 0;
                    failedImports += batchError.writeErrors.length;
                    console.log(` Batch ${Math.floor(i/batchSize) + 1}: ${batchError.writeErrors.length} failed, ${batch.length - batchError.writeErrors.length} succeeded`);
                } else {
                    console.error(` Error importing batch ${Math.floor(i/batchSize) + 1}:`, batchError.message);
                }
            }
        }

        console.log('Data import completed!');
        console.log(`Total records: ${transformedData.length}`);
        console.log(`Successful imports: ${successfulImports}`);
        console.log(`Failed imports: ${failedImports}`);
        
        // Show sample data
        const sample = await Airbnb.findOne();
        if (sample) {
            console.log('\nSample imported record:');
            console.log(`- Name: ${sample.NAME}`);
            console.log(`- Price: $${sample.price}`);
            console.log(`- Room Type: ${sample.room_type}`);
            console.log(`- Neighbourhood: ${sample.neighbourhood}`);
            console.log(`- Images: ${sample.images.length} images`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error.message);
        process.exit(1);
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n Import process interrupted');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});

importData();