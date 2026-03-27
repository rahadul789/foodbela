require('dotenv').config()

const http = require('http')
const { Server } = require('socket.io')
const app = require('./src/app')
const connectDB = require('./src/config/db')
const logger = require('./src/config/logger')
const { setIO } = require('./src/services/socket.service')
const setupSocket = require('./socket/index')
const startRiderAssignmentJob = require('./src/jobs/riderAssignment.job')
const SystemSettings = require('./src/models/SystemSettings')

const PORT = process.env.PORT || 5000

const startServer = async () => {
  // Connect to MongoDB
  await connectDB()

  // Ensure SystemSettings singleton exists
  await SystemSettings.findOneAndUpdate(
    { _id: 'global' },
    {},
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  )

  // Create HTTP server
  const server = http.createServer(app)

  // Setup Socket.IO
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  // Store IO instance globally
  setIO(io)

  // Setup socket event handlers
  setupSocket(io)

  // Start cron jobs
  startRiderAssignmentJob()

  // Start listening
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully')
    server.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
  })
}

startServer().catch(err => {
  logger.error('Server startup failed', { error: err.message })
  process.exit(1)
})
