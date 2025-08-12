const express = require('express');
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics (admin only)
// @access  Private/Admin
router.get('/dashboard', [auth, adminAuth], async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        // Get basic counts
        const [totalProducts, totalUsers, totalBookings, activeRentals] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: true }),
            Booking.countDocuments(dateFilter),
            Booking.countDocuments({ status: 'active', ...dateFilter })
        ]);

        // Get revenue data
        const revenueData = await Booking.aggregate([
            { $match: { status: { $in: ['completed', 'active'] }, ...dateFilter } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$pricing.total' },
                    averageBookingValue: { $avg: '$pricing.total' }
                }
            }
        ]);

        const revenue = revenueData[0] || { totalRevenue: 0, averageBookingValue: 0 };

        res.json({
            success: true,
            stats: {
                totalProducts,
                totalUsers,
                totalBookings,
                activeRentals,
                totalRevenue: revenue.totalRevenue,
                averageBookingValue: revenue.averageBookingValue
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DASHBOARD_STATS_FAILED',
                message: 'Failed to fetch dashboard statistics'
            }
        });
    }
});

// @route   GET /api/reports/export
// @desc    Export report data (admin only)
// @access  Private/Admin
router.get('/export', [auth, adminAuth], async (req, res) => {
    try {
        const { type, format = 'json', startDate, endDate } = req.query;

        if (!type) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_TYPE',
                    message: 'Report type is required'
                }
            });
        }

        let data;
        let filename;

        switch (type) {
            case 'bookings':
                data = await Booking.find({
                    ...(startDate && endDate ? {
                        createdAt: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    } : {})
                }).populate('customer', 'email profile').populate('items.product', 'name category');
                filename = `bookings_${Date.now()}`;
                break;

            case 'products':
                data = await Product.find({ isActive: true });
                filename = `products_${Date.now()}`;
                break;

            case 'users':
                data = await User.find({ isActive: true }).select('-password');
                filename = `users_${Date.now()}`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'INVALID_TYPE',
                        message: 'Invalid report type'
                    }
                });
        }

        if (format === 'csv') {
            // Simple CSV conversion for basic data
            let csvContent = '';

            if (data.length > 0) {
                // Get headers from first object
                const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
                csvContent = headers.join(',') + '\n';

                // Add data rows
                data.forEach(item => {
                    const obj = item.toObject ? item.toObject() : item;
                    const row = headers.map(header => {
                        let value = obj[header];
                        if (typeof value === 'object' && value !== null) {
                            value = JSON.stringify(value);
                        }
                        return `"${String(value || '').replace(/"/g, '""')}"`;
                    }).join(',');
                    csvContent += row + '\n';
                });
            }

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
            res.send(csvContent);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
            res.json({
                success: true,
                data,
                exportedAt: new Date().toISOString(),
                type,
                recordCount: data.length
            });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'EXPORT_FAILED',
                message: 'Failed to export data'
            }
        });
    }
});

module.exports = router;