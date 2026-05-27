/**
 * Helper to determine if a shop is currently open based on its manual offline
 * toggle and dynamic weekly operating hours schedule (JSONB).
 * Supports standard daytime hours and overnight schedules (e.g. 18:00 to 02:00).
 *
 * @param {object} shop - The shop database object
 * @returns {boolean} - True if shop is active and open, false otherwise
 */
export function isShopOpen(shop) {
  // If manual override is_online is false, the shop is strictly closed
  if (shop?.is_online === false) {
    return false;
  }

  // If there's no schedule configured, default to open
  if (!shop?.operating_hours) {
    return true;
  }

  // 24-Hour Economy check
  if (shop.operating_hours.always_open) {
    return true;
  }

  const now = new Date();
  
  // Get day of the week (0 = Sunday, 1 = Monday, etc.)
  const dayIndex = now.getDay();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thuesday", "friday", "saturday"];
  const currentDayKey = days[dayIndex];

  const daySchedule = shop.operating_hours[currentDayKey];
  // If no schedule config for this day, default to open
  if (!daySchedule) {
    return true;
  }

  // If marked explicitly closed for the day
  if (daySchedule.closed) {
    return false;
  }

  // Parse open and close times (HH:MM)
  const openTime = daySchedule.open || "08:00";
  const closeTime = daySchedule.close || "18:00";

  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  const currentH = now.getHours();
  const currentM = now.getMinutes();

  const currentTotalM = currentH * 60 + currentM;
  const openTotalM = openH * 60 + openM;
  const closeTotalM = closeH * 60 + closeM;

  // Handle overnight schedules (e.g. closing time falls on the next day, close < open)
  if (closeTotalM < openTotalM) {
    return currentTotalM >= openTotalM || currentTotalM <= closeTotalM;
  } else {
    // Normal daytime schedule
    return currentTotalM >= openTotalM && currentTotalM <= closeTotalM;
  }
}
