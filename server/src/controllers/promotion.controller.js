const Promotion = require('../models/Promotion')
const Restaurant = require('../models/Restaurant')
const { success, created, error } = require('../utils/response')

// POST /promotions
const createPromotion = async (req, res, next) => {
  try {
    const { restaurantId } = req.body

    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) return error(res, 'Restaurant not found', 404)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    // Deactivate any existing active promotion for this restaurant
    await Promotion.updateMany(
      { restaurantId, isActive: true },
      { isActive: false }
    )

    const promotion = await Promotion.create(req.body)
    return created(res, { promotion }, 'Promotion created')
  } catch (err) {
    next(err)
  }
}

// GET /promotions/:restaurantId — public
const getActivePromotion = async (req, res, next) => {
  try {
    const now = new Date()
    const promotion = await Promotion.findOne({
      restaurantId: req.params.restaurantId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: now } }
      ]
    })

    return success(res, { promotion })
  } catch (err) {
    next(err)
  }
}

// PUT /promotions/:id
const updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
    if (!promotion) return error(res, 'Promotion not found', 404)

    const restaurant = await Restaurant.findById(promotion.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    const updated = await Promotion.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after', runValidators: true
    })

    return success(res, { promotion: updated }, 'Promotion updated')
  } catch (err) {
    next(err)
  }
}

// DELETE /promotions/:id
const deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
    if (!promotion) return error(res, 'Promotion not found', 404)

    const restaurant = await Restaurant.findById(promotion.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    await Promotion.findByIdAndDelete(req.params.id)
    return success(res, null, 'Promotion deleted')
  } catch (err) {
    next(err)
  }
}

// PUT /promotions/:id/toggle
const togglePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
    if (!promotion) return error(res, 'Promotion not found', 404)

    const restaurant = await Restaurant.findById(promotion.restaurantId)
    if (restaurant.ownerId.toString() !== req.user._id.toString()) {
      return error(res, 'Not authorized', 403)
    }

    // If activating, deactivate others for same restaurant
    if (req.body.isActive) {
      await Promotion.updateMany(
        { restaurantId: promotion.restaurantId, _id: { $ne: promotion._id }, isActive: true },
        { isActive: false }
      )
    }

    promotion.isActive = req.body.isActive
    await promotion.save()

    return success(res, { promotion }, `Promotion ${promotion.isActive ? 'activated' : 'deactivated'}`)
  } catch (err) {
    next(err)
  }
}

module.exports = { createPromotion, getActivePromotion, updatePromotion, deletePromotion, togglePromotion }
