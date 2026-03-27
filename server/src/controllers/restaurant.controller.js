const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const MenuCategory = require('../models/MenuCategory')
const Review = require('../models/Review')
const { success, created, paginated, error } = require('../utils/response')
const { getIO } = require('../services/socket.service')
const { createNotification } = require('../services/notification.service')
const logger = require('../config/logger')

// POST /restaurants — restaurant_owner creates restaurant
const createRestaurant = async (req, res, next) => {
  try {
    // One restaurant per owner
    const existing = await Restaurant.findOne({ ownerId: req.user._id })
    if (existing) {
      return error(res, 'You already have a restaurant', 409)
    }

    const restaurantData = {
      ...req.body,
      ownerId: req.user._id
    }

    const restaurant = await Restaurant.create(restaurantData)
    return created(res, { restaurant }, 'Restaurant created')
  } catch (err) {
    next(err)
  }
}

// GET /restaurants/my — restaurant_owner gets own restaurant
const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id })
    if (!restaurant) {
      return error(res, 'No restaurant found', 404)
    }
    return success(res, { restaurant })
  } catch (err) {
    next(err)
  }
}

// PUT /restaurants/:id — restaurant_owner updates own restaurant
const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return error(res, 'Restaurant not found', 404)

    if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return error(res, 'Not authorized', 403)
    }

    const updated = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    })

    return success(res, { restaurant: updated }, 'Restaurant updated')
  } catch (err) {
    next(err)
  }
}

// PUT /restaurants/:id/toggle-open
const toggleOpen = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return error(res, 'Restaurant not found', 404)

    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    restaurant.isOpen = req.body.isOpen
    await restaurant.save()

    return success(res, { restaurant }, `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`)
  } catch (err) {
    next(err)
  }
}

// GET /restaurants — customer searches nearby restaurants
const searchRestaurants = async (req, res, next) => {
  try {
    const {
      lat, lng, radius = 10, cuisine, search,
      isOpen, minRating, maxDeliveryTime, maxDeliveryFee, hasDiscount,
      sortBy, page = 1, limit = 20
    } = req.query

    const filter = { isApproved: true, isActive: true }

    // Geo filter
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    }

    if (cuisine) filter.cuisineTypes = cuisine
    if (isOpen === 'true') filter.isOpen = true
    if (minRating) filter.rating = { $gte: parseFloat(minRating) }
    if (maxDeliveryTime) filter.averageDeliveryTime = { $lte: parseInt(maxDeliveryTime) }
    if (maxDeliveryFee) filter.deliveryFee = { $lte: parseFloat(maxDeliveryFee) }
    if (search) filter.name = { $regex: search, $options: 'i' }

    // hasDiscount: restaurants that have menu items with active discounts
    if (hasDiscount === 'true') {
      const now = new Date()
      const itemsWithDiscount = await MenuItem.distinct('restaurantId', {
        'discount.type': { $exists: true, $ne: null },
        $or: [
          { 'discount.validUntil': { $exists: false } },
          { 'discount.validUntil': null },
          { 'discount.validUntil': { $gte: now } }
        ]
      })
      filter._id = { $in: itemsWithDiscount }
    }

    // $near already sorts by distance — don't add .sort() when geo query is active
    const hasGeoQuery = !!(lat && lng)
    let sort = {}
    if (sortBy === 'rating') sort = { rating: -1 }
    else if (sortBy === 'deliveryTime') sort = { averageDeliveryTime: 1 }
    else if (sortBy === 'deliveryFee') sort = { deliveryFee: 1 }
    else if (!hasGeoQuery) sort = { isFeatured: -1, featuredSortOrder: 1, rating: -1 }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // For count with $near, use a separate filter without $near
    let countFilter = { ...filter }
    if (hasGeoQuery) {
      countFilter = { ...filter }
      delete countFilter.location
      countFilter.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            parseFloat(radius) / 6378.1
          ]
        }
      }
    }
    const total = await Restaurant.countDocuments(countFilter)

    let query = Restaurant.find(filter).skip(skip).limit(parseInt(limit))
    if (Object.keys(sort).length > 0) query = query.sort(sort)
    const restaurants = await query

    return paginated(res, restaurants, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (err) {
    next(err)
  }
}

// GET /restaurants/:id — public detail
const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) return error(res, 'Restaurant not found', 404)
    return success(res, { restaurant })
  } catch (err) {
    next(err)
  }
}

// GET /restaurants/:id/menu — public full menu
const getRestaurantMenu = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find({
      restaurantId: req.params.id,
      isActive: true
    }).sort({ sortOrder: 1 })

    const items = await MenuItem.find({
      restaurantId: req.params.id
    }).sort({ sortOrder: 1 })

    return success(res, { categories, items })
  } catch (err) {
    next(err)
  }
}

// GET /restaurants/:id/reviews — public paginated reviews
const getRestaurantReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const filter = { restaurantId: req.params.id, status: 'approved' }
    const total = await Review.countDocuments(filter)
    const reviews = await Review.find(filter)
      .populate('customerId', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    return paginated(res, reviews, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (err) {
    next(err)
  }
}

// --- Admin endpoints ---

// GET /restaurants/all — admin lists all
const getAllRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const total = await Restaurant.countDocuments()
    const restaurants = await Restaurant.find()
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    return paginated(res, restaurants, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (err) {
    next(err)
  }
}

// PUT /restaurants/:id/approve — admin approves/rejects
const approveRestaurant = async (req, res, next) => {
  try {
    const { isApproved } = req.body
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { returnDocument: 'after' }
    )

    if (!restaurant) return error(res, 'Restaurant not found', 404)

    // Emit socket event + push notification to owner
    try {
      const io = getIO()
      const message = isApproved
        ? 'আপনার restaurant approve হয়েছে! এখন orders নিন'
        : 'আপনার restaurant reject হয়েছে'

      io.to(`user:${restaurant.ownerId}`).emit('restaurant_approved', { isApproved, message })

      await createNotification(io, restaurant.ownerId, {
        title: isApproved ? 'Restaurant Approved!' : 'Restaurant Rejected',
        body: message,
        type: 'system',
        actionType: 'open_app'
      })
    } catch (err) {
      logger.warn('Socket notification failed', { error: err.message })
    }

    return success(res, { restaurant }, `Restaurant ${isApproved ? 'approved' : 'rejected'}`)
  } catch (err) {
    next(err)
  }
}

// PUT /restaurants/:id/admin-status — admin activate/deactivate
const setAdminStatus = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { returnDocument: 'after' }
    )
    if (!restaurant) return error(res, 'Restaurant not found', 404)
    return success(res, { restaurant }, `Restaurant ${req.body.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    next(err)
  }
}

// PUT /restaurants/:id/feature — admin feature/unfeature
const featureRestaurant = async (req, res, next) => {
  try {
    const { isFeatured, featuredSortOrder } = req.body
    const update = { isFeatured }
    if (featuredSortOrder !== undefined) update.featuredSortOrder = featuredSortOrder

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, {
      returnDocument: 'after'
    })
    if (!restaurant) return error(res, 'Restaurant not found', 404)
    return success(res, { restaurant }, `Restaurant ${isFeatured ? 'featured' : 'unfeatured'}`)
  } catch (err) {
    next(err)
  }
}

// DELETE /restaurants/:id — admin deletes
const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id)
    if (!restaurant) return error(res, 'Restaurant not found', 404)

    // Clean up related data
    await MenuCategory.deleteMany({ restaurantId: req.params.id })
    await MenuItem.deleteMany({ restaurantId: req.params.id })

    return success(res, null, 'Restaurant deleted')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createRestaurant, getMyRestaurant, updateRestaurant, toggleOpen,
  searchRestaurants, getRestaurant, getRestaurantMenu, getRestaurantReviews,
  getAllRestaurants, approveRestaurant, setAdminStatus, featureRestaurant, deleteRestaurant
}
