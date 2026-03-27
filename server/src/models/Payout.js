const mongoose = require('mongoose')

const payoutSchema = new mongoose.Schema({
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['rider_payout', 'restaurant_payout', 'cod_collection'],
    required: true
  },

  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'recipientModel' },
  recipientModel: { type: String, enum: ['User', 'Restaurant'], required: true },

  amount: { type: Number, required: true },
  method: { type: String, enum: ['bkash', 'bank', 'cash'], required: true },
  reference: { type: String },

  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  periodFrom: { type: Date },
  periodTo: { type: Date },

  note: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Payout', payoutSchema)
