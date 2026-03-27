const axios = require('axios')
const logger = require('../config/logger')

let bkashToken = null
let tokenExpiry = null

// Get or refresh bKash grant token
const getToken = async () => {
  if (bkashToken && tokenExpiry && Date.now() < tokenExpiry) {
    return bkashToken
  }

  try {
    const { data } = await axios.post(
      `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
      {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json',
          username: process.env.BKASH_USERNAME,
          password: process.env.BKASH_PASSWORD
        }
      }
    )

    bkashToken = data.id_token
    tokenExpiry = Date.now() + 3500000 // ~58 minutes
    return bkashToken
  } catch (error) {
    logger.error('bKash token grant failed', { error: error.message })
    throw error
  }
}

// Create payment
const createPayment = async (amount, orderId, callbackURL) => {
  const token = await getToken()

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
    {
      mode: '0011',
      payerReference: orderId,
      callbackURL: callbackURL || process.env.BKASH_CALLBACK_URL,
      amount: String(amount),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: orderId
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY
      }
    }
  )

  return data
}

// Execute payment
const executePayment = async (paymentID) => {
  const token = await getToken()

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY
      }
    }
  )

  return data
}

// Query payment status
const queryPayment = async (paymentID) => {
  const token = await getToken()

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/payment/status`,
    { paymentID },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY
      }
    }
  )

  return data
}

// Refund payment
const refundPayment = async (paymentID, trxID, amount) => {
  const token = await getToken()

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/payment/refund`,
    {
      paymentID,
      trxID,
      amount: String(amount),
      reason: 'Order cancelled - refund'
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'X-APP-Key': process.env.BKASH_APP_KEY
      }
    }
  )

  return data
}

module.exports = { createPayment, executePayment, queryPayment, refundPayment }
