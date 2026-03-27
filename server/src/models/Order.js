const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String },
    basePrice: { type: Number },
    discountedPrice: { type: Number },
    selectedCustomizations: [{
      name: { type: String },
      optionName: { type: String },
      extraPrice: { type: Number }
    }],
    customizationTotal: { type: Number, default: 0 },
    unitPrice: { type: Number },
    quantity: { type: Number },
    subtotal: { type: Number }
  }],

  subtotal: { type: Number },
  deliveryFee: { type: Number },
  discountFromItems: { type: Number, default: 0 },
  promotionDiscount: { type: Number, default: 0 },
  promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
  voucherDiscount: { type: Number, default: 0 },
  total: { type: Number },

  commissionRate: { type: Number },
  commissionAmount: { type: Number },
  restaurantPayout: { type: Number },
  riderEarning: { type: Number },

  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher' },
  voucherCode: { type: String },

  paymentMethod: { type: String, enum: ['bkash', 'cash_on_delivery'], required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'refund_failed'],
    default: 'pending'
  },
  bkashPaymentID: { type: String },
  bkashTrxID: { type: String },

  riderAssignmentDeadline: { type: Date },

  status: {
    type: String,
    enum: ['payment_pending', 'pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'delivered', 'cancelled'],
    default: 'pending'
  },

  cancelledBy: { type: String, enum: ['customer', 'restaurant', 'admin', 'system'] },
  cancellationReason: { type: String },

  deliveryAddress: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },

  specialInstructions: { type: String },
  distanceKm: { type: Number },
  estimatedDeliveryTime: { type: Number },

  payoutStatus: { type: String },

  nearbyAlertSent: { type: Boolean, default: false },
  nearbyAlertSentAt: { type: Date },

  // Refund
  refundStatus: { type: String, enum: ['none', 'processing', 'completed', 'failed'], default: 'none' },
  refundAmount: { type: Number },
  refundReason: { type: String },
  refundInitiatedAt: { type: Date },
  refundProcessingUntil: { type: Date },
  refundCompletedAt: { type: Date },
  refundFailureReason: { type: String },
  refundProcessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bkashRefundTrxID: { type: String },

  // Ratings (denormalized from Review)
  foodRating: { type: Number },
  deliveryRating: { type: Number },
  review: { type: String },
  isRated: { type: Boolean, default: false }
}, { timestamps: true })

orderSchema.index({ customerId: 1 })
orderSchema.index({ restaurantId: 1 })
orderSchema.index({ riderId: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: 1 })
orderSchema.index({ restaurantId: 1, status: 1 })
orderSchema.index({ riderId: 1, status: 1 })
orderSchema.index({ refundStatus: 1 })
orderSchema.index({ riderAssignmentDeadline: 1 })
orderSchema.index({ payoutStatus: 1 })

module.exports = mongoose.model('Order', orderSchema)
