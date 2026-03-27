const mongoose = require('mongoose')

const daySchema = {
  open: { type: String },
  close: { type: String },
  isOpen: { type: Boolean, default: true }
}

const restaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  logo: { type: String },
  coverImage: { type: String },
  phone: { type: String },
  email: { type: String },

  address: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },

  cuisineTypes: [{ type: String }],
  tags: [{ type: String }],

  isOpen: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  openingHours: {
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema
  },

  deliveryRadius: { type: Number, default: 5 },
  minimumOrder: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  averageDeliveryTime: { type: Number, default: 30 },

  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  featuredSortOrder: { type: Number, default: 0 },

  commissionRate: { type: Number, default: 10 }
}, { timestamps: true })

restaurantSchema.index({ location: '2dsphere' })
restaurantSchema.index({ isApproved: 1, isActive: 1, isOpen: 1 })

module.exports = mongoose.model('Restaurant', restaurantSchema)
