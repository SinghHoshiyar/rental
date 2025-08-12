const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String // URLs to product images
  }],
  isRentable: {
    type: Boolean,
    default: true
  },
  rentalUnits: [{
    unit: {
      type: String,
      enum: ['hour', 'day', 'week', 'month', 'year'],
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    minDuration: {
      type: Number,
      default: 1,
      min: 1
    },
    maxDuration: {
      type: Number,
      min: 1
    }
  }],
  inventory: {
    totalQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  specifications: {
    type: Map,
    of: String // Flexible key-value pairs for product specs
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isRentable: 1, isActive: 1 });

// Virtual for availability status
productSchema.virtual('isAvailable').get(function () {
  return this.inventory.availableQuantity > 0;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
  virtuals: true
});

// Pre-save middleware to validate inventory
productSchema.pre('save', function (next) {
  if (this.inventory.availableQuantity + this.inventory.reservedQuantity > this.inventory.totalQuantity) {
    next(new Error('Available + Reserved quantity cannot exceed total quantity'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Product', productSchema);