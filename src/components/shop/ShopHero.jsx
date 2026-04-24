import { useNavigate } from 'react-router-dom';
import { createPublicSession } from '../../utils/qr-session';
import './ShopHero.css';

export default function ShopHero({ shop }) {
  const navigate = useNavigate();
  const initial = shop?.name ? shop.name.charAt(0).toUpperCase() : '🌿';
  
  const handleStartOrdering = () => {
    if (shop?.id) {
      createPublicSession(shop.id);
      navigate('/menu');
    }
  };

  const handleViewOffers = () => {
    if (shop?.id) {
      createPublicSession(shop.id);
      navigate('/menu?filter=offers');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: shop?.name || 'Modern Savannah',
      text: shop?.tagline || 'Check out this amazing shop on Modern Savannah!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Shop link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };
  
  return (
    <section className="hero">
      <div className="hero__logo">
        {shop?.logo_url ? (
          <img src={shop.logo_url} alt={shop.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <h1 className="hero__heading">{shop?.name || "Welcome to our Shop"}</h1>
      <p className="hero__subtext">{shop?.tagline || "Fresh • Affordable • Trusted"}</p>
      <div className="hero__actions">
        <button onClick={handleStartOrdering} className="btn btn--primary cursor-pointer">Start Ordering</button>
        <button onClick={handleViewOffers} className="btn btn--secondary cursor-pointer">View Offers</button>
        <button onClick={handleShare} className="btn btn--share cursor-pointer">
           <span className="mr-2">🔗</span> Share Shop
        </button>
      </div>
    </section>
  );
}
