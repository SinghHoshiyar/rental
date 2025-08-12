const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['booking_reminder', 'return_reminder', 'late_fee', 'booking_confirmed', 'payment_received', 'booking_cancelled'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    scheduledFor: {
        type: Date
    },
    sentAt: {
        type: Date
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ type: 1, sentAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);