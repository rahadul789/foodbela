const mongoose = require('mongoose')

const broadcastNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  imageUrl: { type: String },
  targetRole: {
    type: String,
    enum: ['all', 'customer', 'rider', 'restaurant_owner'],
    default: 'all'
  },
  targetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  data: { type: mongoose.Schema.Types.Mixed },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentAt: { type: Date, default: Date.now },
  recipientCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'sending', 'completed', 'failed'],
    default: 'pending'
  }
}, { timestamps: true })

broadcastNotificationSchema.index({ sentBy: 1 })
broadcastNotificationSchema.index({ sentAt: 1 })
broadcastNotificationSchema.index({ targetRole: 1 })

module.exports = mongoose.model('BroadcastNotification', broadcastNotificationSchema)
