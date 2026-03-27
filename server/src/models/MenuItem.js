const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: false },
  preparationTime: { type: Number },

  discount: {
    type: { type: String, enum: ['percentage', 'fixed'] },
    value: { type: Number },
    validUntil: { type: Date }
  },

  customizations: [{
    name: { type: String },
    type: { type: String, enum: ['single', 'multiple'] },
    required: { type: Boolean, default: false },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number },
    options: [{
      name: { type: String },
      price: { type: Number, default: 0 }
    }]
  }],

  tags: [{ type: String }],
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true })

menuItemSchema.index({ restaurantId: 1, categoryId: 1 })
menuItemSchema.index({ name: 'text', description: 'text' })

module.exports = mongoose.model('MenuItem', menuItemSchema)
