const mongoose = require('mongoose')

const promotionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  title: { type: String, required: true },
  thresholdAmount: { type: Number, required: true },
  discountType: { type: String, enum: ['fixed', 'percentage'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('Promotion', promotionSchema)
