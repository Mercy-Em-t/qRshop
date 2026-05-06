/**
 * image-utils.js
 * 
 * Utility helpers for serving optimised product images using Supabase
 * Storage's built-in image transformation API.
 * 
 * Usage:
 *   import { getOptimizedImageUrl } from '../utils/image-utils';
 *   <img src={getOptimizedImageUrl(product.image_url, { width: 400 })} />
 * 
 * Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');

/**
 * Returns an optimised Supabase Storage URL using the transform API.
 * Falls back to the original URL if the image is external or URL is missing.
 *
 * @param {string|null} imageUrl  - Original image URL (from product_images or menu_items.image_url)
 * @param {object} options
 * @param {number} [options.width=800]    - Target width in px
 * @param {number} [options.quality=80]   - JPEG/WebP quality (1-100)
 * @param {'cover'|'contain'|'fill'} [options.resize='cover'] - Resize mode
 * @returns {string|null}
 */
export function getOptimizedImageUrl(imageUrl, { width = 800, quality = 80, resize = 'cover' } = {}) {
  if (!imageUrl) return null;

  // Only transform images hosted on our Supabase instance
  if (!SUPABASE_URL || !imageUrl.startsWith(SUPABASE_URL)) {
    return imageUrl;
  }

  // Supabase transform endpoint: append ?width=&quality=&resize= to the render path
  // Original URL format: https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path>
  // Transform URL format: https://<ref>.supabase.co/storage/v1/render/image/public/<bucket>/<path>?width=...
  const transformUrl = imageUrl
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');

  const params = new URLSearchParams({ width, quality, resize });
  return `${transformUrl}?${params.toString()}`;
}

/**
 * Preset helpers for common use cases.
 */

/** Small thumbnail for product grid/list cards (400px wide) */
export const getThumbnailUrl = (url) =>
  getOptimizedImageUrl(url, { width: 400, quality: 75 });

/** Medium image for product detail pages (800px wide) */
export const getDetailImageUrl = (url) =>
  getOptimizedImageUrl(url, { width: 800, quality: 85 });

/** Full-size for marketing studio / download (original quality) */
export const getFullImageUrl = (url) => url ?? null;
