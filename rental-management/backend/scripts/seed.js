const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental-management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = new User({
            email: 'admin@rentalhub.com',
            password: adminPassword,
            role: 'admin',
            profile: {
                firstName: 'Admin',
                lastName: 'User'
            }
        });
        await admin.save();

        // Create customer user
        const customerPassword = await bcrypt.hash('customer123', 10);
        const customer = new User({
            email: 'customer@example.com',
            password: customerPassword,
            role: 'customer',
            profile: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1234567890'
            }
        });
        await customer.save();

        // Create sample products
        const products = [
            {
                name: 'Professional Camera',
                description: 'High-quality DSLR camera perfect for photography and videography projects.',
                category: 'Electronics',
                images: ['https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500'],
                rentalUnits: [
                    { unit: 'day', price: 50, minDuration: 1, maxDuration: 30 },
                    { unit: 'week', price: 300, minDuration: 1, maxDuration: 8 }
                ],
                inventory: {
                    totalQuantity: 5,
                    availableQuantity: 5,
                    reservedQuantity: 0
                },
                specifications: new Map([
                    ['Brand', 'Canon'],
                    ['Model', 'EOS R5'],
                    ['Resolution', '45MP'],
                    ['Video', '8K RAW']
                ])
            },
            {
                name: 'Power Drill',
                description: 'Heavy-duty cordless power drill for construction and DIY projects.',
                category: 'Tools',
                images: ['https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500'],
                rentalUnits: [
                    { unit: 'day', price: 25, minDuration: 1, maxDuration: 14 },
                    { unit: 'week', price: 150, minDuration: 1, maxDuration: 4 }
                ],
                inventory: {
                    totalQuantity: 10,
                    availableQuantity: 8,
                    reservedQuantity: 2
                },
                specifications: new Map([
                    ['Brand', 'DeWalt'],
                    ['Voltage', '20V MAX'],
                    ['Chuck Size', '1/2 inch'],
                    ['Battery', 'Lithium-ion']
                ])
            },
            {
                name: 'Camping Tent',
                description: '4-person waterproof camping tent, perfect for outdoor adventures.',
                category: 'Outdoor',
                images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500'],
                rentalUnits: [
                    { unit: 'day', price: 30, minDuration: 2, maxDuration: 14 },
                    { unit: 'week', price: 180, minDuration: 1, maxDuration: 4 }
                ],
                inventory: {
                    totalQuantity: 15,
                    availableQuantity: 12,
                    reservedQuantity: 3
                },
                specifications: new Map([
                    ['Capacity', '4 persons'],
                    ['Material', 'Polyester'],
                    ['Waterproof', 'Yes'],
                    ['Weight', '8.5 lbs']
                ])
            },
            {
                name: 'Projector',
                description: 'HD projector for presentations, movies, and events.',
                category: 'Electronics',
                images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500'],
                rentalUnits: [
                    { unit: 'day', price: 40, minDuration: 1, maxDuration: 7 },
                    { unit: 'week', price: 250, minDuration: 1, maxDuration: 4 }
                ],
                inventory: {
                    totalQuantity: 8,
                    availableQuantity: 6,
                    reservedQuantity: 2
                },
                specifications: new Map([
                    ['Resolution', '1080p Full HD'],
                    ['Brightness', '3000 lumens'],
                    ['Connectivity', 'HDMI, USB, WiFi'],
                    ['Throw Distance', '3-30 feet']
                ])
            },
            {
                name: 'Folding Tables',
                description: 'Set of 6-foot folding tables, perfect for events and gatherings.',
                category: 'Furniture',
                images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
                rentalUnits: [
                    { unit: 'day', price: 15, minDuration: 1, maxDuration: 30 },
                    { unit: 'week', price: 90, minDuration: 1, maxDuration: 8 }
                ],
                inventory: {
                    totalQuantity: 20,
                    availableQuantity: 18,
                    reservedQuantity: 2
                },
                specifications: new Map([
                    ['Size', '6 feet x 2.5 feet'],
                    ['Material', 'Heavy-duty plastic'],
                    ['Weight Capacity', '300 lbs'],
                    ['Foldable', 'Yes']
                ])
            }
        ];

        for (const productData of products) {
            const product = new Product(productData);
            await product.save();
        }

        console.log('✅ Seed data created successfully!');
        console.log('👤 Admin user: admin@rentalhub.com / admin123');
        console.log('👤 Customer user: customer@example.com / customer123');
        console.log(`📦 Created ${products.length} sample products`);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

const run = async () => {
    await connectDB();
    await seedData();
};

run();