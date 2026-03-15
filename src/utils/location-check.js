export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function isWithinRadius(shopLat, shopLon, radiusMeters = 50) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(false)
      return
export function checkLocation(shopLat, shopLng, maxDistanceMeters = 50) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          shopLat,
          shopLon
        )
        resolve(distance <= radiusMeters)
      },
      () => resolve(false)
    )
  })
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(latitude, longitude, shopLat, shopLng);
        resolve({
          withinRange: distance <= maxDistanceMeters,
          distance,
          userLat: latitude,
          userLng: longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
