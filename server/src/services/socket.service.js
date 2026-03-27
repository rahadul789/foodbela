// Socket.IO helper functions
let ioInstance = null

const setIO = (io) => {
  ioInstance = io
}

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized')
  }
  return ioInstance
}

// Find a specific user's socket
const getUserSocket = (userId) => {
  const io = getIO()
  const sockets = [...io.sockets.sockets.values()]
  return sockets.find(s => s.userId === userId.toString())
}

// Emit to a user's personal room
const emitToUser = (userId, event, data) => {
  const io = getIO()
  io.to(`user:${userId}`).emit(event, data)
}

// Emit to a restaurant room
const emitToRestaurant = (restaurantId, event, data) => {
  const io = getIO()
  io.to(`restaurant:${restaurantId}`).emit(event, data)
}

// Emit to admin room
const emitToAdmin = (event, data) => {
  const io = getIO()
  io.to('admin').emit(event, data)
}

// Emit to all connected sockets
const emitToAll = (event, data) => {
  const io = getIO()
  io.emit(event, data)
}

module.exports = { setIO, getIO, getUserSocket, emitToUser, emitToRestaurant, emitToAdmin, emitToAll }
