// Haversine formula — calculate distance between two lat/lng points in km
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const toRad = (deg) => deg * (Math.PI / 180)

// Estimate delivery time in minutes
// prep time + travel time (25 km/h average speed)
const estimateDeliveryTime = (prepTime, distanceKm) => {
  const travelMinutes = Math.ceil((distanceKm / 25) * 60)
  return (prepTime || 30) + travelMinutes
}

module.exports = { calculateDistance, estimateDeliveryTime }
