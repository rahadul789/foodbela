const cron = require('node-cron')
const Order = require('../models/Order')
const User = require('../models/User')
const logger = require('../config/logger')
const { getIO } = require('../services/socket.service')

const startRiderAssignmentJob = () => {
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const io = getIO()
      const now = new Date()

      const overdueOrders = await Order.find({
        status: 'ready',
        riderId: null,
        riderAssignmentDeadline: { $lt: now }
      }).populate('restaurantId', 'name location')

      if (overdueOrders.length === 0) return

      logger.info('Overdue unassigned orders found', { count: overdueOrders.length })

      for (const order of overdueOrders) {
        // Re-broadcast to all online riders individually
        const onlineRiders = await User.find(
          { role: 'rider', isOnline: true, isApproved: true },
          '_id'
        )

        for (const rider of onlineRiders) {
          io.to(`user:${rider._id}`).emit('new_order_available', {
            order: {
              _id: order._id,
              orderNumber: order.orderNumber,
              total: order.total,
              deliveryAddress: order.deliveryAddress
            },
            restaurant: order.restaurantId,
            distance: null
          })
        }

        // Alert admin
        io.to('admin').emit('unassigned_order_alert', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          restaurantName: order.restaurantId?.name,
          waitedSeconds: Math.floor((now - order.riderAssignmentDeadline) / 1000) + 60
        })

        // Push deadline forward 60s to avoid repeat alerts every 30s
        await Order.findByIdAndUpdate(order._id, {
          riderAssignmentDeadline: new Date(Date.now() + 60000)
        })
      }
    } catch (err) {
      logger.error('Rider assignment cron error', { error: err.message })
    }
  })

  logger.info('Rider assignment cron job started (every 30s)')
}

module.exports = startRiderAssignmentJob
