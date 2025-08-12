const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('booking', 'bookingNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ recipient: req.user.id });
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'NOTIFICATIONS_FETCH_FAILED',
                message: 'Failed to fetch notifications'
            }
        });
    }
});

// @route   POST /api/notifications/send
// @desc    Send notification (admin only)
// @access  Private/Admin
router.post('/send', [auth, adminAuth], async (req, res) => {
    try {
        const { recipient, type, title, message, booking } = req.body;

        if (!recipient || !type || !title || !message) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'Recipient, type, title, and message are required'
                }
            });
        }

        const notification = new Notification({
            recipient,
            type,
            title,
            message,
            booking,
            sentAt: new Date()
        });

        await notification.save();

        // In production, this would also send email/SMS
        // For now, we'll just save to database

        res.status(201).json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('Notification send error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'NOTIFICATION_SEND_FAILED',
                message: 'Failed to send notification'
            }
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Notification not found'
                }
            });
        }

        // Check if user owns this notification
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            success: true,
            notification
        });

    } catch (error) {
        console.error('Notification read error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'NOTIFICATION_READ_FAILED',
                message: 'Failed to mark notification as read'
            }
        });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'MARK_ALL_READ_FAILED',
                message: 'Failed to mark all notifications as read'
            }
        });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Notification not found'
                }
            });
        }

        // Check if user owns this notification or is admin
        if (notification.recipient.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        await notification.deleteOne();

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Notification delete error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'NOTIFICATION_DELETE_FAILED',
                message: 'Failed to delete notification'
            }
        });
    }
});

module.exports = router;