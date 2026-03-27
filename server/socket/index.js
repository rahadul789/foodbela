const jwt = require('jsonwebtoken')
const User = require('../src/models/User')
const Order = require('../src/models/Order')
const DeliveryTracking = require('../src/models/DeliveryTracking')
const logger = require('../src/config/logger')
const { calculateDistance } = require('../src/utils/distance')

const setupSocket = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (!user) {
        return next(new Error('User not found'))
      }

      socket.userId = user._id.toString()
      socket.userRole = user.role
      socket.userName = user.name
      next()
    } catch (err) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    logger.info('Socket connected', { userId: socket.userId, role: socket.userRole })

    // Auto-join personal room
    socket.join(`user:${socket.userId}`)

    // --- Room Management ---

    socket.on('join_order_room', ({ orderId }) => {
      socket.join(`order:${orderId}`)
      logger.info('Joined order room', { userId: socket.userId, orderId })
    })

    socket.on('leave_order_room', ({ orderId }) => {
      socket.leave(`order:${orderId}`)
    })

    socket.on('join_restaurant_room', ({ restaurantId }) => {
      socket.join(`restaurant:${restaurantId}`)
      logger.info('Joined restaurant room', { userId: socket.userId, restaurantId })
    })

    socket.on('join_admin_room', () => {
      if (socket.userRole === 'admin') {
        socket.join('admin')
        logger.info('Admin joined admin room', { userId: socket.userId })
      }
    })

    // --- Rider Events ---

    socket.on('rider_online', async ({ lat, lng }) => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: true,
          'currentLocation.coordinates': [lng, lat]
        })
        socket.join('riders_online')
        logger.info('Rider online', { userId: socket.userId })
      } catch (err) {
        logger.error('rider_online error', { error: err.message })
      }
    })

    socket.on('rider_offline', async () => {
      try {
        // Block if rider has assigned orders
        const activeOrders = await Order.countDocuments({
          riderId: socket.userId,
          status: 'assigned'
        })
        if (activeOrders > 0) {
          socket.emit('error', { message: 'Complete your queued orders before going offline' })
          return
        }

        await User.findByIdAndUpdate(socket.userId, { isOnline: false })
        socket.leave('riders_online')
        logger.info('Rider offline', { userId: socket.userId })
      } catch (err) {
        logger.error('rider_offline error', { error: err.message })
      }
    })

    // Rider location during active delivery (every 5s)
    socket.on('rider_location_update', async ({ orderId, lat, lng }) => {
      try {
        // Update delivery tracking
        await DeliveryTracking.findOneAndUpdate(
          { orderId },
          {
            currentLat: lat,
            currentLng: lng,
            lastUpdated: new Date(),
            $push: { path: { lat, lng, timestamp: new Date() } }
          }
        )

        // Update rider's current location
        await User.findByIdAndUpdate(socket.userId, {
          'currentLocation.coordinates': [lng, lat]
        })

        // Broadcast to order room (customer)
        io.to(`order:${orderId}`).emit('rider_location', {
          lat, lng, orderId, timestamp: new Date()
        })

        // Broadcast to admin for live map
        io.to('admin').emit('admin_rider_location', {
          riderId: socket.userId, lat, lng, orderId
        })

        // Check nearby alert
        const order = await Order.findById(orderId)
        if (order && !order.nearbyAlertSent && order.deliveryAddress) {
          const distance = calculateDistance(
            lat, lng,
            order.deliveryAddress.lat, order.deliveryAddress.lng
          )

          if (distance <= 0.5) { // 500m
            io.to(`user:${order.customerId}`).emit('rider_nearby', {
              orderId, distanceMeters: Math.round(distance * 1000)
            })
            await Order.findByIdAndUpdate(orderId, {
              nearbyAlertSent: true,
              nearbyAlertSentAt: new Date()
            })
          }
        }
      } catch (err) {
        logger.error('rider_location_update error', { error: err.message })
      }
    })

    // Rider idle location (every 30s, online but no active delivery)
    socket.on('rider_location_idle', async ({ lat, lng }) => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          'currentLocation.coordinates': [lng, lat]
        })
        io.to('admin').emit('admin_rider_location', {
          riderId: socket.userId, lat, lng, orderId: null
        })
      } catch (err) {
        logger.error('rider_location_idle error', { error: err.message })
      }
    })

    // --- Disconnect ---

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId: socket.userId })
    })
  })
}

module.exports = setupSocket
