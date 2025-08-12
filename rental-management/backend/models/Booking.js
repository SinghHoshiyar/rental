const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    rentalUnit: {
      type: String,
      required: true,
      enum: ['hour', 'day', 'week', 'month', 'year']
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  dates: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    actualReturnDate: {
      type: Date
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFees: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ 'dates.startDate': 1, 'dates.endDate': 1 });

// Virtual for booking duration in days
bookingSchema.virtual('durationInDays').get(function () {
  if (this.dates.startDate && this.dates.endDate) {
    const diffTime = Math.abs(this.dates.endDate - this.dates.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for late return status
bookingSchema.virtual('isLateReturn').get(function () {
  if (this.dates.actualReturnDate && this.dates.endDate) {
    return this.dates.actualReturnDate > this.dates.endDate;
  }
  if (!this.dates.actualReturnDate && this.dates.endDate) {
    return new Date() > this.dates.endDate && this.status === 'active';
  }
  return false;
});

// Ensure virtual fields are serialized
bookingSchema.set('toJSON', {
  virtuals: true
});

// Pre-save validation
bookingSchema.pre('save', function (next) {
  if (this.dates.startDate >= this.dates.endDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);