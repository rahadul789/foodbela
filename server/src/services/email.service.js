const transporter = require('../config/email')
const logger = require('../config/logger')

const sendPasswordResetEmail = async (userEmail, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Password Reset - FoodBela',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    logger.info('Password reset email sent', { to: userEmail })
  } catch (error) {
    logger.error('Failed to send password reset email', { error: error.message, to: userEmail })
    throw error
  }
}

const sendOrderConfirmationEmail = async (userEmail, orderNumber) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: userEmail,
    subject: `Order Confirmed - ${orderNumber}`,
    html: `
      <h2>Your Order is Confirmed!</h2>
      <p>Order Number: <strong>${orderNumber}</strong></p>
      <p>We'll notify you when your order is ready for delivery.</p>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    logger.info('Order confirmation email sent', { to: userEmail, orderNumber })
  } catch (error) {
    logger.error('Failed to send order confirmation email', { error: error.message })
  }
}

module.exports = { sendPasswordResetEmail, sendOrderConfirmationEmail }
