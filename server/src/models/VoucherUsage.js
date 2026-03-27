const mongoose = require('mongoose')

const voucherUsageSchema = new mongoose.Schema({
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  discountAmount: { type: Number, required: true },
  usedAt: { type: Date, default: Date.now }
}, { timestamps: false })

voucherUsageSchema.index({ voucherId: 1, userId: 1 })

module.exports = mongoose.model('VoucherUsage', voucherUsageSchema)
