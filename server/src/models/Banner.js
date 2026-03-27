const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },

  type: { type: String, enum: ['restaurant', 'voucher', 'url'], required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  voucherCode: { type: String },
  link: { type: String },

  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  expiresAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('Banner', bannerSchema)
