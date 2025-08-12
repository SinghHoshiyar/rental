const express = require('express');
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get bookings (user's own bookings or all for admin)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = {};

        // If not admin, only show user's own bookings
        if (req.user.role !== 'admin') {
            filter.customer = req.user.id;
        }

        // Add status filter if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }

        const bookings = await Booking.find(filter)
            .populate('customer', 'email profile')
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Booking.countDocuments(filter);

        res.json({
            success: true,
            bookings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Bookings fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BOOKINGS_FETCH_FAILED',
                message: 'Failed to fetch bookings'
            }
        });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('customer', 'email profile')
            .populate('items.product', 'name images category');

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: 'Booking not found'
                }
            });
        }

        // Check if user owns this booking or is admin
        if (req.user.role !== 'admin' && booking.customer._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        res.json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Booking fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BOOKING_FETCH_FAILED',
                message: 'Failed to fetch booking'
            }
        });
    }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', auth, [
    body('items').isArray({ min: 1 }),
    body('dates.startDate').isISO8601(),
    body('dates.endDate').isISO8601(),
    body('pricing.total').isNumeric()
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

        const { items, dates, pricing, deliveryAddress, notes } = req.body;

        // Validate dates
        const startDate = new Date(dates.startDate);
        const endDate = new Date(dates.endDate);

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_DATES',
                    message: 'End date must be after start date'
                }
            });
        }

        if (startDate < new Date()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_START_DATE',
                    message: 'Start date cannot be in the past'
                }
            });
        }

        // Validate products and availability
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product || !product.isActive) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PRODUCT_NOT_FOUND',
                        message: `Product not found: ${item.product}`
                    }
                });
            }

            if (product.inventory.availableQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_INVENTORY',
                        message: `Insufficient inventory for product: ${product.name}`
                    }
                });
            }
        }

        // Generate booking number
        const bookingNumber = 'BK' + Date.now().toString().slice(-8);

        // Create booking
        const booking = new Booking({
            bookingNumber,
            customer: req.user.id,
            items,
            dates,
            pricing,
            deliveryAddress,
            notes,
            status: 'pending'
        });

        await booking.save();

        // Reserve inventory
        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: {
                    'inventory.availableQuantity': -item.quantity,
                    'inventory.reservedQuantity': item.quantity
                }
            });
        }

        // Populate the booking before returning
        await booking.populate('customer', 'email profile');
        await booking.populate('items.product', 'name images category');

        res.status(201).json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BOOKING_CREATION_FAILED',
                message: 'Failed to create booking'
            }
        });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: 'Booking not found'
                }
            });
        }

        // Check permissions
        const isOwner = booking.customer.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        // Update allowed fields
        const allowedUpdates = ['status', 'notes', 'dates.actualReturnDate'];
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        Object.keys(updates).forEach(key => {
            if (key.includes('.')) {
                const [parent, child] = key.split('.');
                if (!booking[parent]) booking[parent] = {};
                booking[parent][child] = updates[key];
            } else {
                booking[key] = updates[key];
            }
        });

        await booking.save();

        res.json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Booking update error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BOOKING_UPDATE_FAILED',
                message: 'Failed to update booking'
            }
        });
    }
});

// @route   POST /api/bookings/:id/confirm
// @desc    Confirm booking
// @access  Private
router.post('/:id/confirm', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: 'Booking not found'
                }
            });
        }

        // Check if user owns this booking or is admin
        if (req.user.role !== 'admin' && booking.customer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        if (booking.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Booking cannot be confirmed in current status'
                }
            });
        }

        booking.status = 'confirmed';
        await booking.save();

        res.json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Booking confirmation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BOOKING_CONFIRMATION_FAILED',
                message: 'Failed to confirm booking'
            }
        });
    }
});

// @route   POST /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.post('/:id/cancel', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: 'Booking not found'
                }
            });
        }

        // Check if user owns this booking or is admin
        if (req.user.role !== 'admin' && booking.customer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        if (['completed', 'cancelled'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Booking cannot be cancelled in current status'
                }
            });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Release reserved inventory
        for (const item of booking.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: {
                    'inventory.availableQuantity': item.quantity,
                    'inventory.reservedQuantity': -item.quantity
                }
            });
        }

        res.json({
            success: true,
            booking
        });

    } catch (error) {
        console.error('Booking cancellation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BOOKING_CANCELLATION_FAILED',
                message: 'Failed to cancel booking'
            }
        });
    }
});

module.exports = router;