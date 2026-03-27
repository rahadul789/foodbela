const mongoose = require('mongoose')

const cuisineTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  icon: { type: String },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true })

cuisineTypeSchema.index({ isActive: 1 })

module.exports = mongoose.model('CuisineType', cuisineTypeSchema)
