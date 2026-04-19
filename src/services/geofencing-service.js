/**
 * Geofencing Service
 * Handles distance calculations and location-based logic.
 */

/**
 * Calculates the Haversine distance between two points on the Earth.
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Checks if a user is within the shop's service area.
 * @param {Object} userLoc - { latitude, longitude }
 * @param {Object} shopLoc - { latitude, longitude }
 * @param {number} radius - Radius in meters
 * @returns {Object} { isWithin, distance }
 */
export function checkGeofence(userLoc, shopLoc, radius = 10000) {
  if (!userLoc || !shopLoc) return { isWithin: true, distance: 0 }; // Default to allowed if data missing

  const distance = calculateDistance(
    userLoc.latitude,
    userLoc.longitude,
    shopLoc.latitude,
    shopLoc.longitude
  );

  return {
    isWithin: distance <= radius,
    distance,
  };
}
