const rateLimit = require('express-rate-limit')

// General rate limiter: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Auth rate limiter: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Forgot password: 3 requests per hour
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset requests, try again in an hour' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { generalLimiter, authLimiter, forgotPasswordLimiter }
