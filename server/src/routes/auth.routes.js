const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const auth = require('../middleware/auth.middleware')
const validate = require('../middleware/validate.middleware')
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter.middleware')
const {
  register, login, getMe, changePassword, updateProfile,
  getNotificationPreferences, updateNotificationPreferences,
  forgotPassword, resetPassword, savePushToken
} = require('../controllers/auth.controller')

// POST /auth/register
router.post('/register', authLimiter, validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('role').optional().isIn(['customer', 'rider', 'restaurant_owner', 'admin']).withMessage('Invalid role')
]), register)

// POST /auth/login
router.post('/login', authLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]), login)

// GET /auth/me
router.get('/me', auth, getMe)

// PUT /auth/change-password
router.put('/change-password', auth, validate([
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
]), changePassword)

// PUT /auth/profile
router.put('/profile', auth, updateProfile)

// GET /auth/notification-preferences
router.get('/notification-preferences', auth, getNotificationPreferences)

// PUT /auth/notification-preferences
router.put('/notification-preferences', auth, updateNotificationPreferences)

// POST /auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, validate([
  body('email').isEmail().withMessage('Valid email is required')
]), forgotPassword)

// POST /auth/reset-password
router.post('/reset-password', validate([
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
]), resetPassword)

// POST /auth/push-token
router.post('/push-token', auth, validate([
  body('expoPushToken').notEmpty().withMessage('Push token is required')
]), savePushToken)

module.exports = router
