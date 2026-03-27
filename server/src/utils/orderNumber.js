const Counter = require('../models/Counter')

const generateOrderNumber = async () => {
  const now = new Date()
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
  const counterId = `order_${datePart}`

  const doc = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  )

  return `ORD-${datePart}-${String(doc.seq).padStart(6, '0')}`
}

module.exports = { generateOrderNumber }
