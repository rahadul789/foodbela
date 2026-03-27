const mongoose = require('mongoose')

const voucherSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['admin', 'restaurant', 'referral'], required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },

  code: { type: String, required: true, unique: true, uppercase: true, trim: true },

  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },

  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },

  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },

  applicableTo: { type: String, enum: ['all', 'specific_restaurants'], default: 'all' },
  applicableRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],

  restrictedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  referralRewardFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralPeriod: { type: String },

  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },

  description: { type: String }
}, { timestamps: true })

voucherSchema.index({ restaurantId: 1 })
voucherSchema.index({ createdBy: 1 })
voucherSchema.index({ referralRewardFor: 1, referralPeriod: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Voucher', voucherSchema)
