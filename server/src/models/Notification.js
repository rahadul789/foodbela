const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['order_update', 'new_order', 'payment', 'refund', 'promo', 'system'],
    required: true
  },
  data: { type: mongoose.Schema.Types.Mixed },
  image: { type: String },
  sound: { type: String },
  groupKey: { type: String },
  actionType: { type: String, enum: ['open_order', 'open_promotion', 'open_app', 'custom'] },
  actionData: { type: mongoose.Schema.Types.Mixed },
  imageDisplayMode: { type: String, enum: ['thumbnail', 'full', 'hidden'], default: 'thumbnail' },
  isRead: { type: Boolean, default: false },
  pushSent: { type: Boolean, default: false },
  pushSentAt: { type: Date }
}, { timestamps: true })

notificationSchema.index({ userId: 1, isRead: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
