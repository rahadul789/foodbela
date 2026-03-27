const Restaurant = require('../models/Restaurant')
const MenuItem = require('../models/MenuItem')
const { success } = require('../utils/response')

// GET /search?q=burger&lat=&lng=
const search = async (req, res, next) => {
  try {
    const { q, lat, lng } = req.query

    if (!q || q.trim().length === 0) {
      return success(res, { restaurants: [], dishes: [] })
    }

    const regex = { $regex: q, $options: 'i' }

    // Search restaurants by name
    const restaurantFilter = {
      isApproved: true,
      isActive: true,
      name: regex
    }

    if (lat && lng) {
      restaurantFilter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 10000 // 10km
        }
      }
    }

    const restaurants = await Restaurant.find(restaurantFilter).limit(20)

    // Search menu items by name (text search)
    const dishes = await MenuItem.find({
      $or: [
        { name: regex },
        { description: regex }
      ],
      isAvailable: true
    })
      .populate('restaurantId', 'name logo isOpen isApproved isActive')
      .limit(30)

    // Filter dishes to only include items from approved/active restaurants
    const filteredDishes = dishes.filter(d =>
      d.restaurantId?.isApproved && d.restaurantId?.isActive
    )

    return success(res, { restaurants, dishes: filteredDishes })
  } catch (err) {
    next(err)
  }
}

module.exports = { search }
