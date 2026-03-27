const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  foodRating: { type: Number, required: true, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  comment: { type: String },

  // Moderation
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectedReason: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date }
}, { timestamps: true })

reviewSchema.index({ restaurantId: 1 })
reviewSchema.index({ status: 1 })
reviewSchema.index({ restaurantId: 1, status: 1 })

module.exports = mongoose.model('Review', reviewSchema)
