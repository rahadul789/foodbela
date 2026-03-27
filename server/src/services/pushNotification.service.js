const axios = require('axios')
const Notification = require('../models/Notification')
const User = require('../models/User')
const logger = require('../config/logger')

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

const sendPushToUser = async (userId, notificationData) => {
  const user = await User.findById(userId)

  if (!user?.expoPushToken) {
    logger.warn('User has no expoPushToken', { userId })
    return null
  }

  // Check notification preferences
  if (notificationData.type === 'promo' && !user.notificationPreferences?.promotions) {
    logger.info('User opted out of promo notifications', { userId })
    return null
  }

  const payload = {
    to: user.expoPushToken,
    title: notificationData.title,
    body: notificationData.body,
    data: {
      type: notificationData.type,
      actionType: notificationData.actionType || 'open_app',
      actionData: JSON.stringify(notificationData.actionData || {})
    }
  }

  if (notificationData.image) payload.data.image = notificationData.image
  if (notificationData.sound) payload.sound = notificationData.sound
  if (notificationData.groupKey) payload.data.groupKey = notificationData.groupKey
  if (notificationData.badge) payload.badge = notificationData.badge

  try {
    const response = await axios.post(EXPO_PUSH_URL, payload, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    })

    logger.info('Push sent to Expo', { userId, ticketId: response.data?.data?.id })

    await Notification.create({
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      image: notificationData.image,
      sound: notificationData.sound,
      groupKey: notificationData.groupKey,
      actionType: notificationData.actionType,
      actionData: notificationData.actionData,
      imageDisplayMode: notificationData.imageDisplayMode || 'thumbnail',
      pushSent: true,
      pushSentAt: new Date()
    })

    return response.data
  } catch (error) {
    logger.error('Push send failed', { userId, error: error.message })

    await Notification.create({
      userId,
      title: notificationData.title,
      body: notificationData.body,
      type: notificationData.type,
      pushSent: false
    })

    return null
  }
}

const sendPushToUsers = async (userIds, notificationData) => {
  const promises = userIds.map(userId =>
    sendPushToUser(userId, notificationData).catch(err => {
      logger.error('Failed to send to user', { userId, error: err.message })
      return null
    })
  )
  return Promise.allSettled(promises)
}

const sendPushToAllOnlineRiders = async (orderData) => {
  const riders = await User.find({
    role: 'rider',
    isOnline: true,
    isApproved: true,
    expoPushToken: { $exists: true, $ne: null }
  })

  const notificationData = {
    title: `New Order! ৳${orderData.total}`,
    body: `${orderData.restaurantName} - ${orderData.itemCount} items`,
    type: 'new_order',
    sound: 'order_alert',
    actionType: 'open_order',
    actionData: { orderId: orderData._id?.toString() }
  }

  return sendPushToUsers(riders.map(r => r._id), notificationData)
}

module.exports = { sendPushToUser, sendPushToUsers, sendPushToAllOnlineRiders }
