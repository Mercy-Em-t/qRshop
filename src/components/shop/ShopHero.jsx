import { Link } from 'react-router-dom';
import './ShopHero.css';

export default function ShopHero({ shop }) {
  const initial = shop?.name ? shop.name.charAt(0).toUpperCase() : '🌿';
  
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
        <Link to={`/shops/${shop?.id}/menu`} className="btn btn--primary">Start Ordering</Link>
        <Link to={`/shops/${shop?.id}/menu?filter=offers`} className="btn btn--secondary">View Offers</Link>
      </div>
    </section>
  );
}
