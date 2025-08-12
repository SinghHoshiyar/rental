const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-intent
// @desc    Create payment intent
// @access  Private
router.post('/create-intent', auth, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: 'Booking ID and amount are required'
                }
            });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BOOKING_NOT_FOUND',
                    message: 'Booking not found'
                }
            });
        }

        // Check if user owns this booking
        if (booking.customer.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Access denied'
                }
            });
        }

        // For now, return a mock payment intent
        // In production, this would integrate with Stripe, PayPal, etc.
        const paymentIntent = {
            id: 'pi_' + Date.now(),
            amount: amount * 100, // Convert to cents
            currency: 'usd',
            status: 'requires_payment_method'
        };

        // Create payment record
        const payment = new Payment({
            booking: bookingId,
            amount,
            currency: 'USD',
            paymentMethod: 'stripe',
            paymentIntentId: paymentIntent.id,
            status: 'pending'
        });

        await payment.save();

        res.json({
            success: true,
            paymentIntent,
            payment
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PAYMENT_INTENT_FAILED',
                message: 'Failed to create payment intent'
            }
        });
    }
});

// @route   POST /api/payments/confirm
// @desc    Confirm payment
// @access  Private
router.post('/confirm', auth, async (req, res) => {
    try {
        const { paymentIntentId, transactionId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_PAYMENT_INTENT',
                    message: 'Payment intent ID is required'
                }
            });
        }

        const payment = await Payment.findOne({ paymentIntentId });
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PAYMENT_NOT_FOUND',
                    message: 'Payment not found'
                }
            });
        }

        // Update payment status
        payment.status = 'succeeded';
        payment.transactionId = transactionId || 'txn_' + Date.now();
        await payment.save();

        // Update booking payment status
        const booking = await Booking.findById(payment.booking);
        if (booking) {
            booking.paymentStatus = 'paid';
            booking.paymentIntentId = paymentIntentId;
            await booking.save();
        }

        res.json({
            success: true,
            payment
        });

    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PAYMENT_CONFIRMATION_FAILED',
                message: 'Failed to confirm payment'
            }
        });
    }
});

// @route   GET /api/payments/:id/status
// @desc    Get payment status
// @access  Private
router.get('/:id/status', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('booking', 'customer bookingNumber');

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PAYMENT_NOT_FOUND',
                    message: 'Payment not found'
                }
            });
        }

        // Check if user owns this payment
        if (payment.booking.customer.toString() !== req.user.id && req.user.role !== 'admin') {
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
            payment: {
                id: payment._id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                transactionId: payment.transactionId,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        console.error('Payment status fetch error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'PAYMENT_STATUS_FAILED',
                message: 'Failed to fetch payment status'
            }
        });
    }
});

// @route   POST /api/payments/refund
// @desc    Process refund (admin only)
// @access  Private/Admin
router.post('/refund', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Admin access required'
                }
            });
        }

        const { paymentId, amount, reason } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PAYMENT_NOT_FOUND',
                    message: 'Payment not found'
                }
            });
        }

        if (payment.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PAYMENT_STATUS',
                    message: 'Payment must be succeeded to process refund'
                }
            });
        }

        // In production, this would call the payment gateway's refund API
        // For now, we'll just update the status
        payment.status = 'refunded';
        payment.metadata = {
            ...payment.metadata,
            refundAmount: amount || payment.amount,
            refundReason: reason,
            refundDate: new Date()
        };

        await payment.save();

        res.json({
            success: true,
            message: 'Refund processed successfully',
            payment
        });

    } catch (error) {
        console.error('Refund processing error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REFUND_FAILED',
                message: 'Failed to process refund'
            }
        });
    }
});

module.exports = router;