const mongoose = require('mongoose')

const systemSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },
  appName: { type: String, default: 'FoodBela' },
  commissionRate: { type: Number, default: 10 },
  defaultDeliveryFee: { type: Number, default: 50 },
  minOrderAmount: { type: Number, default: 100 },
  maxDeliveryRadius: { type: Number, default: 10 },
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: '' },
  refundSlaHours: { type: Number, default: 2 },
  riderAssignmentTimeout: { type: Number, default: 60 },
  supportPhone: { type: String, default: '' },
  supportEmail: { type: String, default: '' },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

module.exports = mongoose.model('SystemSettings', systemSettingsSchema)
