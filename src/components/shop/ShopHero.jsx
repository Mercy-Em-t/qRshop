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
  
  const customTitle = shop?.appearance_config?.wordings?.hero_title || shop?.name || "Welcome to our Shop";
  const customSubtext = shop?.appearance_config?.wordings?.hero_subtitle || shop?.tagline || "Fresh • Affordable • Trusted";
  const trustScore = shop?.trust_score || 5;
  const stars = "⭐".repeat(Math.round(trustScore));

  return (
    <section className="hero">
      <div className="hero__logo">
        {shop?.logo_url ? (
          <img src={shop.logo_url} alt={shop.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <h1 className="hero__heading">{customTitle}</h1>
      <p className="hero__subtext">{customSubtext}</p>
      
      <div className="flex items-center gap-1.5 justify-center mb-6 bg-slate-50 border border-slate-100 rounded-full px-4 py-1.5 w-fit mx-auto mt-2">
         <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Merchant Trust Score:</span>
         <span className="text-xs">{stars}</span>
         <span className="text-xs font-black text-slate-700">{trustScore}/5</span>
      </div>

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
