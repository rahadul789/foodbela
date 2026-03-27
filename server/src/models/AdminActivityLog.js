const mongoose = require('mongoose')

const adminActivityLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetType: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String }
}, { timestamps: true })

adminActivityLogSchema.index({ adminId: 1 })
adminActivityLogSchema.index({ targetType: 1, targetId: 1 })
adminActivityLogSchema.index({ createdAt: 1 })

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema)
