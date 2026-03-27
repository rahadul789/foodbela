const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const auth = require('../middleware/auth.middleware')
const authorize = require('../middleware/role.middleware')
const validate = require('../middleware/validate.middleware')
const {
  createPromotion, getActivePromotion, updatePromotion, deletePromotion, togglePromotion
} = require('../controllers/promotion.controller')

router.post('/', auth, authorize('restaurant_owner'), validate([
  body('restaurantId').notEmpty().withMessage('restaurantId is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('thresholdAmount').isNumeric().withMessage('thresholdAmount must be a number'),
  body('discountType').isIn(['fixed', 'percentage']).withMessage('Invalid discount type'),
  body('discountValue').isNumeric().withMessage('discountValue must be a number')
]), createPromotion)

router.get('/:restaurantId', getActivePromotion)

router.put('/:id', auth, authorize('restaurant_owner'), updatePromotion)

router.delete('/:id', auth, authorize('restaurant_owner'), deletePromotion)

router.put('/:id/toggle', auth, authorize('restaurant_owner'), validate([
  body('isActive').isBoolean().withMessage('isActive must be boolean')
]), togglePromotion)

module.exports = router
