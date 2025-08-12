const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', [auth, adminAuth], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USERS_FETCH_FAILED',
                message: 'Failed to fetch users'
            }
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private/Admin
router.get('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USER_FETCH_FAILED',
                message: 'Failed to fetch user'
            }
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const { role, isActive, profile } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Update allowed fields
        if (role !== undefined) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (profile) {
            Object.keys(profile).forEach(key => {
                if (profile[key] !== undefined) {
                    user.profile[key] = profile[key];
                }
            });
        }

        await user.save();

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USER_UPDATE_FAILED',
                message: 'Failed to update user'
            }
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        // Soft delete by setting isActive to false
        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('User delete error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USER_DELETE_FAILED',
                message: 'Failed to delete user'
            }
        });
    }
});

module.exports = router;