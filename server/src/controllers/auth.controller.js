const crypto = require('crypto')
const User = require('../models/User')
const SystemSettings = require('../models/SystemSettings')
const { generateToken } = require('../utils/jwt')
const { success, created, error } = require('../utils/response')
const { sendPasswordResetEmail } = require('../services/email.service')
const { getIO } = require('../services/socket.service')
const { createNotification } = require('../services/notification.service')
const logger = require('../config/logger')

// Generate unique referral code
const generateReferralCode = (name) => {
  const prefix = name.replace(/\s+/g, '').substring(0, 5).toUpperCase()
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 4)
  return `${prefix}${suffix}`
}

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, referralCode } = req.body

    // Check if email exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return error(res, 'Email already registered', 409)
    }

    // Build user data
    const userData = { name, email, password, phone, role: role || 'customer' }

    // Generate referral code
    userData.referralCode = generateReferralCode(name)

    // Handle referral
    if (referralCode) {
      const referrer = await User.findOne({ referralCode })
      if (referrer) {
        userData.referredBy = referrer._id
      }
    }

    // Riders and restaurant owners start unapproved
    if (userData.role === 'rider' || userData.role === 'restaurant_owner') {
      userData.isApproved = false
    }

    const user = await User.create(userData)

    // Emit registration alert to admin for riders and restaurant owners
    if (user.role === 'rider' || user.role === 'restaurant_owner') {
      try {
        const io = getIO()
        io.to('admin').emit('new_registration_alert', {
          type: user.role === 'rider' ? 'rider' : 'restaurant',
          userId: user._id,
          name: user.name,
          registeredAt: user.createdAt
        })

        // Push notification to admins
        const admins = await User.find({ role: 'admin' })
        for (const admin of admins) {
          await createNotification(io, admin._id, {
            title: 'New Registration',
            body: `${user.name} registered as ${user.role === 'rider' ? 'a rider' : 'a restaurant owner'}`,
            type: 'system',
            actionType: 'open_app'
          }, true)
        }
      } catch (err) {
        logger.warn('Socket not ready during registration', { error: err.message })
      }
    }

    const token = generateToken(user._id)

    const userResponse = user.toObject()
    delete userResponse.password

    return created(res, { user: userResponse, token }, 'Registration successful')
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return error(res, 'Invalid email or password', 401)
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401)
    }

    if (!user.isActive) {
      return error(res, 'Account deactivated. Contact support.', 401)
    }

    // Check maintenance mode (non-admin only)
    if (user.role !== 'admin') {
      const settings = await SystemSettings.findById('global')
      if (settings?.maintenanceMode) {
        return res.status(503).json({
          success: false,
          message: settings.maintenanceMessage || 'System is under maintenance'
        })
      }
    }

    const token = generateToken(user._id)

    const userResponse = user.toObject()
    delete userResponse.password

    return success(res, { user: userResponse, token }, 'Login successful')
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    return success(res, { user: req.user })
  } catch (err) {
    next(err)
  }
}

// PUT /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user._id).select('+password')
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return error(res, 'Current password is incorrect', 400)
    }

    user.password = newPassword
    await user.save()

    return success(res, null, 'Password changed successfully')
  } catch (err) {
    next(err)
  }
}

// PUT /api/v1/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, profileImage } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, profileImage },
      { returnDocument: 'after', runValidators: true }
    )

    return success(res, { user }, 'Profile updated')
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/auth/notification-preferences
const getNotificationPreferences = async (req, res, next) => {
  try {
    return success(res, {
      preferences: req.user.notificationPreferences || {
        orderUpdates: true,
        promotions: true,
        newRestaurants: true,
        sound: true,
        vibration: true
      }
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/v1/auth/notification-preferences
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const updates = {}
    const fields = ['orderUpdates', 'promotions', 'newRestaurants', 'sound', 'vibration']
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates[`notificationPreferences.${field}`] = req.body[field]
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { returnDocument: 'after' })

    return success(res, { preferences: user.notificationPreferences }, 'Preferences updated')
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal whether email exists
      return success(res, null, 'If that email exists, a reset link has been sent')
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    user.passwordResetToken = hashedToken
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    await user.save({ validateBeforeSave: false })

    // Send email with plain token
    await sendPasswordResetEmail(user.email, resetToken)

    return success(res, null, 'If that email exists, a reset link has been sent')
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() }
    }).select('+passwordResetToken')

    if (!user) {
      return error(res, 'Invalid or expired reset token', 400)
    }

    user.password = newPassword
    user.passwordResetToken = undefined
    user.passwordResetExpiry = undefined
    await user.save()

    return success(res, null, 'Password reset successful')
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/auth/push-token
const savePushToken = async (req, res, next) => {
  try {
    const { expoPushToken } = req.body

    await User.findByIdAndUpdate(req.user._id, { expoPushToken })

    return success(res, null, 'Push token saved')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register, login, getMe, changePassword, updateProfile,
  getNotificationPreferences, updateNotificationPreferences,
  forgotPassword, resetPassword, savePushToken
}
