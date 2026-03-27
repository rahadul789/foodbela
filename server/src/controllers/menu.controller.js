const MenuCategory = require('../models/MenuCategory')
const MenuItem = require('../models/MenuItem')
const Restaurant = require('../models/Restaurant')
const { success, created, paginated, error } = require('../utils/response')

// --- Menu Categories ---

// POST /menu/categories
const createCategory = async (req, res, next) => {
  try {
    const { restaurantId } = req.body

    // Verify ownership
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) return error(res, 'Restaurant not found', 404)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    const category = await MenuCategory.create(req.body)
    return created(res, { category }, 'Category created')
  } catch (err) {
    next(err)
  }
}

// GET /menu/categories/:restaurantId
const getCategories = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find({
      restaurantId: req.params.restaurantId
    }).sort({ sortOrder: 1 })

    return success(res, { categories })
  } catch (err) {
    next(err)
  }
}

// PUT /menu/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id)
    if (!category) return error(res, 'Category not found', 404)

    const restaurant = await Restaurant.findById(category.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    const updated = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after', runValidators: true
    })

    return success(res, { category: updated }, 'Category updated')
  } catch (err) {
    next(err)
  }
}

// DELETE /menu/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findById(req.params.id)
    if (!category) return error(res, 'Category not found', 404)

    const restaurant = await Restaurant.findById(category.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    // Delete items in this category
    await MenuItem.deleteMany({ categoryId: req.params.id })
    await MenuCategory.findByIdAndDelete(req.params.id)

    return success(res, null, 'Category and its items deleted')
  } catch (err) {
    next(err)
  }
}

// --- Menu Items ---

// POST /menu/items
const createItem = async (req, res, next) => {
  try {
    const { restaurantId } = req.body

    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) return error(res, 'Restaurant not found', 404)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    const item = await MenuItem.create(req.body)
    return created(res, { item }, 'Item created')
  } catch (err) {
    next(err)
  }
}

// GET /menu/items/:restaurantId?categoryId=
const getItems = async (req, res, next) => {
  try {
    const filter = { restaurantId: req.params.restaurantId }
    if (req.query.categoryId) filter.categoryId = req.query.categoryId

    const items = await MenuItem.find(filter).sort({ sortOrder: 1 })
    return success(res, { items })
  } catch (err) {
    next(err)
  }
}

// GET /menu/items/single/:id
const getItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return error(res, 'Item not found', 404)
    return success(res, { item })
  } catch (err) {
    next(err)
  }
}

// PUT /menu/items/:id
const updateItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return error(res, 'Item not found', 404)

    const restaurant = await Restaurant.findById(item.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after', runValidators: true
    })

    return success(res, { item: updated }, 'Item updated')
  } catch (err) {
    next(err)
  }
}

// PUT /menu/items/:id/availability
const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return error(res, 'Item not found', 404)

    const restaurant = await Restaurant.findById(item.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    item.isAvailable = req.body.isAvailable
    await item.save()

    return success(res, { item }, `Item ${item.isAvailable ? 'available' : 'unavailable'}`)
  } catch (err) {
    next(err)
  }
}

// PUT /menu/items/:id/discount
const setDiscount = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return error(res, 'Item not found', 404)

    const restaurant = await Restaurant.findById(item.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    const { type, value, validUntil } = req.body

    // If type is null/undefined, remove discount
    if (!type) {
      item.discount = { type: undefined, value: undefined, validUntil: undefined }
    } else {
      item.discount = { type, value, validUntil }
    }

    await item.save()
    return success(res, { item }, type ? 'Discount set' : 'Discount removed')
  } catch (err) {
    next(err)
  }
}

// DELETE /menu/items/:id
const deleteItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id)
    if (!item) return error(res, 'Item not found', 404)

    const restaurant = await Restaurant.findById(item.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    await MenuItem.findByIdAndDelete(req.params.id)
    return success(res, null, 'Item deleted')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createCategory, getCategories, updateCategory, deleteCategory,
  createItem, getItems, getItem, updateItem, toggleAvailability, setDiscount, deleteItem
}
