import { useNavigate } from 'react-router-dom';
import { createPublicSession } from '../../utils/qr-session';
import { getThumbnailUrl } from '../../utils/image-utils';
import './ShopHero.css';

export default function ShopHero({ shop }) {
  const navigate = useNavigate();
  const initial = shop?.name ? shop.name.charAt(0).toUpperCase() : '🌿';
  const isOpen = shop?.is_online !== false;

  const handleStartOrdering = () => {
    if (shop?.id) {
      createPublicSession(shop.id);
      navigate('/menu');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: shop?.name || 'Modern Savannah',
      text: shop?.tagline || 'Check out this amazing shop!',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Shop link copied to clipboard!');
      }
    } catch (err) { /* ignore */ }
  };

  const customTitle = shop?.appearance_config?.wordings?.hero_title || shop?.name || "Welcome";
  const customSubtext = shop?.appearance_config?.wordings?.hero_subtitle || shop?.tagline || "Fresh • Affordable • Trusted";
  const coverImage = shop?.cover_image_url || shop?.appearance_config?.cover_image_url;
  const trustScore = Math.min(5, Math.max(0, shop?.trust_score || 5));

  return (
    <section className="shop-hero">
      {/* Cover Image / Gradient Background */}
      <div className="shop-hero__cover">
        {coverImage ? (
          <img src={coverImage} alt={shop?.name} className="shop-hero__cover-img" />
        ) : (
          <div className="shop-hero__cover-gradient" />
        )}
        <div className="shop-hero__cover-overlay" />
      </div>

      {/* Floating Content Card */}
      <div className="shop-hero__card">
        {/* Logo */}
        <div className="shop-hero__logo">
          {shop?.logo_url ? (
            <img src={getThumbnailUrl(shop.logo_url)} alt={shop.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="shop-hero__logo-initial">{initial}</span>
          )}
        </div>

        {/* Open / Closed Badge */}
        <div className={`shop-hero__status ${isOpen ? 'shop-hero__status--open' : 'shop-hero__status--closed'}`}>
          <span className="shop-hero__status-dot" />
          {isOpen ? 'Open Now' : 'Currently Closed'}
        </div>

        {/* Industry type chip */}
        {shop?.industry_type && (
          <span className="shop-hero__industry">{shop.industry_type}</span>
        )}

        <h1 className="shop-hero__name">{customTitle}</h1>
        <p className="shop-hero__tagline">{customSubtext}</p>

        {/* Trust Score */}
        {trustScore > 0 && (
          <div className="shop-hero__trust">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`shop-hero__star ${i < Math.round(trustScore) ? 'shop-hero__star--filled' : 'shop-hero__star--empty'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="shop-hero__trust-score">{trustScore.toFixed(1)}</span>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="shop-hero__actions">
          <button
            onClick={handleStartOrdering}
            disabled={!isOpen}
            className={`shop-hero__btn shop-hero__btn--primary ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isOpen ? '🛒 Order Now' : '🔒 Shop Closed'}
          </button>
          <button onClick={handleShare} className="shop-hero__btn shop-hero__btn--share">
            🔗 Share
          </button>
        </div>

        {/* WhatsApp Quick Contact */}
        {(shop?.whatsapp_number || shop?.phone) && (
          <a
            href={`https://wa.me/${(shop.whatsapp_number || shop.phone).replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shop-hero__whatsapp"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
