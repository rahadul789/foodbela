const logger = require('../config/logger')

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  })

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ success: false, message: 'Validation error', errors })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    })
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' })
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  })
}

module.exports = errorHandler
