const mongoose = require('mongoose')

const deliveryTrackingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['assigned', 'picked_up', 'delivered'], default: 'assigned' },

  acceptedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },

  path: [{
    lat: { type: Number },
    lng: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],

  currentLat: { type: Number },
  currentLng: { type: Number },
  lastUpdated: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('DeliveryTracking', deliveryTrackingSchema)
