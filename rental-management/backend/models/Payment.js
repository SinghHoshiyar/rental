const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'razorpay'],
        required: true
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed // Gateway-specific data
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ booking: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);