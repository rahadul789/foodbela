const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')

const errorHandler = require('./middleware/error.middleware')
const { generalLimiter } = require('./middleware/rateLimiter.middleware')

// Route imports
const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const restaurantRoutes = require('./routes/restaurant.routes')
const menuRoutes = require('./routes/menu.routes')
const promotionRoutes = require('./routes/promotion.routes')
const orderRoutes = require('./routes/order.routes')
const paymentRoutes = require('./routes/payment.routes')
const deliveryRoutes = require('./routes/delivery.routes')
const voucherRoutes = require('./routes/voucher.routes')
const notificationRoutes = require('./routes/notification.routes')
const adminRoutes = require('./routes/admin.routes')
const payoutRoutes = require('./routes/payout.routes')
const bannerRoutes = require('./routes/banner.routes')
const searchRoutes = require('./routes/search.routes')
const uploadRoutes = require('./routes/upload.routes')
const cuisineTypeRoutes = require('./routes/cuisineType.routes')
const analyticsRoutes = require('./routes/analytics.routes')
const reviewRoutes = require('./routes/review.routes')
const broadcastRoutes = require('./routes/broadcast.routes')
const exportRoutes = require('./routes/export.routes')
const settingsRoutes = require('./routes/settings.routes')
const activityLogRoutes = require('./routes/activityLog.routes')

const app = express()

// Security & parsing middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// HTTP request logging
app.use(morgan('combined'))

// Rate limiter on all routes
app.use(generalLimiter)

// Health check — outside /api/v1/ for Kubernetes probes
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState
  const status = dbState === 1 ? 'ok' : 'error'
  const db = dbState === 1 ? 'connected' : 'disconnected'
  const statusCode = dbState === 1 ? 200 : 503

  res.status(statusCode).json({
    status,
    db,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Mount all routes under /api/v1/
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/restaurants', restaurantRoutes)
app.use('/api/v1/menu/categories', menuRoutes)
app.use('/api/v1/menu/items', menuRoutes)
app.use('/api/v1/promotions', promotionRoutes)
app.use('/api/v1/orders', orderRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/delivery', deliveryRoutes)
app.use('/api/v1/vouchers', voucherRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/payouts', payoutRoutes)
app.use('/api/v1/banners', bannerRoutes)
app.use('/api/v1/search', searchRoutes)
app.use('/api/v1/upload', uploadRoutes)
app.use('/api/v1/cuisine-types', cuisineTypeRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/reviews', reviewRoutes)
app.use('/api/v1/broadcasts', broadcastRoutes)
app.use('/api/v1/export', exportRoutes)
app.use('/api/v1/settings', settingsRoutes)
app.use('/api/v1/activity-log', activityLogRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Global error handler
app.use(errorHandler)

module.exports = app
