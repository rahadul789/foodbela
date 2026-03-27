const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const auth = require('../middleware/auth.middleware')
const authorize = require('../middleware/role.middleware')
const validate = require('../middleware/validate.middleware')
const logAdminAction = require('../middleware/adminActivity.middleware')
const {
  createRestaurant, getMyRestaurant, updateRestaurant, toggleOpen,
  searchRestaurants, getRestaurant, getRestaurantMenu, getRestaurantReviews,
  getAllRestaurants, approveRestaurant, setAdminStatus, featureRestaurant, deleteRestaurant
} = require('../controllers/restaurant.controller')

// Restaurant owner routes
router.post('/', auth, authorize('restaurant_owner'), validate([
  body('name').trim().notEmpty().withMessage('Restaurant name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
]), createRestaurant)

router.get('/my', auth, authorize('restaurant_owner'), getMyRestaurant)

router.put('/:id', auth, authorize('restaurant_owner', 'admin'), updateRestaurant)

router.put('/:id/toggle-open', auth, authorize('restaurant_owner'), validate([
  body('isOpen').isBoolean().withMessage('isOpen must be boolean')
]), toggleOpen)

// Admin routes — MUST come before /:id to avoid matching "all" as id
router.get('/all', auth, authorize('admin'), getAllRestaurants)

// Public routes
router.get('/', searchRestaurants)
router.get('/:id', getRestaurant)
router.get('/:id/menu', getRestaurantMenu)
router.get('/:id/reviews', getRestaurantReviews)

// Admin routes
router.put('/:id/approve', auth, authorize('admin'),
  logAdminAction('approve_restaurant', 'Restaurant'),
  validate([body('isApproved').isBoolean().withMessage('isApproved must be boolean')]),
  approveRestaurant
)

router.put('/:id/admin-status', auth, authorize('admin'),
  logAdminAction('update_restaurant_status', 'Restaurant'),
  setAdminStatus
)

router.put('/:id/feature', auth, authorize('admin'), featureRestaurant)

router.delete('/:id', auth, authorize('admin'),
  logAdminAction('delete_restaurant', 'Restaurant'),
  deleteRestaurant
)

module.exports = router
