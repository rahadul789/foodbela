const express = require('express')
const { body } = require('express-validator')
const router = express.Router()

const auth = require('../middleware/auth.middleware')
const authorize = require('../middleware/role.middleware')
const validate = require('../middleware/validate.middleware')
const {
  createCategory, getCategories, updateCategory, deleteCategory,
  createItem, getItems, getItem, updateItem, toggleAvailability, setDiscount, deleteItem
} = require('../controllers/menu.controller')

// --- Category Routes ---

router.post('/categories', auth, authorize('restaurant_owner'), validate([
  body('restaurantId').notEmpty().withMessage('restaurantId is required'),
  body('name').trim().notEmpty().withMessage('Category name is required')
]), createCategory)

router.get('/categories/:restaurantId', getCategories)

router.put('/categories/:id', auth, authorize('restaurant_owner'), updateCategory)

router.delete('/categories/:id', auth, authorize('restaurant_owner'), deleteCategory)

// --- Item Routes ---

router.post('/items', auth, authorize('restaurant_owner'), validate([
  body('restaurantId').notEmpty().withMessage('restaurantId is required'),
  body('categoryId').notEmpty().withMessage('categoryId is required'),
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('price').isNumeric().withMessage('Price must be a number')
]), createItem)

router.get('/items/single/:id', getItem)

router.get('/items/:restaurantId', getItems)

router.put('/items/:id', auth, authorize('restaurant_owner'), updateItem)

router.put('/items/:id/availability', auth, authorize('restaurant_owner'), validate([
  body('isAvailable').isBoolean().withMessage('isAvailable must be boolean')
]), toggleAvailability)

router.put('/items/:id/discount', auth, authorize('restaurant_owner'), setDiscount)

router.delete('/items/:id', auth, authorize('restaurant_owner'), deleteItem)

module.exports = router
