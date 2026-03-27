const Notification = require('../models/Notification')
const { sendPushToUser } = require('./pushNotification.service')
const logger = require('../config/logger')

// Create in-app notification + emit via socket + optionally send push
const createNotification = async (io, userId, notificationData, sendPush = true) => {
  try {
    // Save to DB
    const notification = await Notification.create({
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      data: notificationData.data,
      image: notificationData.image,
      sound: notificationData.sound,
      groupKey: notificationData.groupKey,
      actionType: notificationData.actionType,
      actionData: notificationData.actionData,
      imageDisplayMode: notificationData.imageDisplayMode || 'thumbnail'
    })

    // Emit via socket to user's personal room
    io.to(`user:${userId}`).emit('notification', {
      _id: notification._id,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      data: notificationData.data
    })

    // Send push notification
    if (sendPush) {
      sendPushToUser(userId, notificationData).catch(err => {
        logger.error('Push notification failed', { userId, error: err.message })
      })
    }

    return notification
  } catch (error) {
    logger.error('Failed to create notification', { userId, error: error.message })
    return null
  }
}

module.exports = { createNotification }
