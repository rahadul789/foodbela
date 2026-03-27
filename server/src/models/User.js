const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ['customer', 'rider', 'restaurant_owner', 'admin'],
    default: 'customer'
  },
  profileImage: { type: String },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // Customer-specific
  savedAddresses: [{
    label: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false }
  }],

  // Rider-specific
  vehicleType: { type: String, enum: ['bicycle', 'motorcycle', 'car'] },
  vehicleNumber: { type: String },
  isOnline: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isApproved: { type: Boolean, default: false },
  earnings: {
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 }
  },

  // Push notifications
  expoPushToken: { type: String },
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    newRestaurants: { type: Boolean, default: true },
    sound: { type: Boolean, default: true },
    vibration: { type: Boolean, default: true }
  },

  // Password reset
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date },

  // Customer favorites
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],

  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 }
}, { timestamps: true })

// Indexes
userSchema.index({ role: 1 })
userSchema.index({ isOnline: 1 })
userSchema.index({ currentLocation: '2dsphere' })

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
