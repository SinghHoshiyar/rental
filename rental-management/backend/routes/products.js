const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        const filter = { isActive: true };

        // Add category filter if provided
        if (req.query.category) {
            filter.category = req.query.category;
        }

        // Add search filter if provided
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(filter);

        res.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Products fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PRODUCTS_FETCH_FAILED',
                message: 'Failed to fetch products'
            }
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Product fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PRODUCT_FETCH_FAILED',
                message: 'Failed to fetch product'
            }
        });
    }
});

// @route   POST /api/products
// @desc    Create new product (admin only)
// @access  Private/Admin
router.post('/', [auth, adminAuth], [
    body('name').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category').notEmpty().trim(),
    body('rentalUnits').isArray({ min: 1 }),
    body('inventory.totalQuantity').isInt({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: errors.array()
                }
            });
        }

        const productData = req.body;
        productData.inventory.availableQuantity = productData.inventory.totalQuantity;

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PRODUCT_CREATION_FAILED',
                message: 'Failed to create product'
            }
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product (admin only)
// @access  Private/Admin
router.put('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        // Update product fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== '_id') {
                product[key] = req.body[key];
            }
        });

        await product.save();

        res.json({
            success: true,
            product
        });

    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PRODUCT_UPDATE_FAILED',
                message: 'Failed to update product'
            }
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (admin only)
// @access  Private/Admin
router.delete('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        // Soft delete by setting isActive to false
        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        console.error('Product delete error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PRODUCT_DELETE_FAILED',
                message: 'Failed to delete product'
            }
        });
    }
});

// @route   GET /api/products/:id/availability
// @desc    Check product availability
// @access  Public
router.get('/:id/availability', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DATES',
                    message: 'Start date and end date are required'
                }
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found'
                }
            });
        }

        // For now, return basic availability based on inventory
        // In a full implementation, this would check against existing bookings
        const available = product.inventory.availableQuantity > 0;

        res.json({
            success: true,
            available,
            availableQuantity: product.inventory.availableQuantity,
            totalQuantity: product.inventory.totalQuantity
        });

    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AVAILABILITY_CHECK_FAILED',
                message: 'Failed to check availability'
            }
        });
    }
});

module.exports = router;