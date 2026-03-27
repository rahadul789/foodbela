const AdminActivityLog = require('../models/AdminActivityLog')
const logger = require('../config/logger')

const logAdminAction = (action, targetType) => {
  return async (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res)

    res.json = function (data) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const targetId = req.params.id || req.params.restaurantId || req.params.riderId || null

        AdminActivityLog.create({
          adminId: req.user._id,
          action,
          targetType,
          targetId,
          details: data?.data || null,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(err => {
          logger.error('Failed to log admin activity', { error: err.message, action })
        })
      }

      return originalJson(data)
    }

    next()
  }
}

module.exports = logAdminAction
