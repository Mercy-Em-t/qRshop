import { useNavigate } from 'react-router-dom';
import { createPublicSession } from '../../utils/qr-session';
import { getThumbnailUrl } from '../../utils/image-utils';
import { slugify } from '../../utils/slugify';
import './ProductGrid.css';

// Maps category names to relevant emojis
const categoryEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('burger') || n.includes('sandwich')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('drink') || n.includes('beverage') || n.includes('juice')) return '🥤';
  if (n.includes('coffee') || n.includes('tea') || n.includes('cafe')) return '☕';
  if (n.includes('rice') || n.includes('meal') || n.includes('food') || n.includes('main')) return '🍽️';
  if (n.includes('snack') || n.includes('chips')) return '🍟';
  if (n.includes('dessert') || n.includes('cake') || n.includes('sweet')) return '🍰';
  if (n.includes('chicken') || n.includes('meat') || n.includes('beef')) return '🍗';
  if (n.includes('salad') || n.includes('veggie') || n.includes('vegetable')) return '🥗';
  if (n.includes('fish') || n.includes('seafood')) return '🐟';
  if (n.includes('bread') || n.includes('bakery')) return '🥖';
  if (n.includes('fruit')) return '🍎';
  if (n.includes('dairy') || n.includes('milk')) return '🥛';
  if (n.includes('shirt') || n.includes('top') || n.includes('tee')) return '👕';
  if (n.includes('shoe') || n.includes('boot') || n.includes('sneaker')) return '👟';
  if (n.includes('dress') || n.includes('skirt')) return '👗';
  if (n.includes('bag') || n.includes('handbag') || n.includes('purse')) return '👜';
  if (n.includes('hat') || n.includes('cap')) return '🧢';
  if (n.includes('electronics') || n.includes('tech') || n.includes('gadget')) return '📱';
  if (n.includes('laptop') || n.includes('computer')) return '💻';
  if (n.includes('beauty') || n.includes('skincare') || n.includes('makeup')) return '💄';
  return '📦';
};

export default function ProductGrid({ items = [], shopId }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  const handleProductClick = (itemId, itemName) => {
    if (shopId) {
      createPublicSession(shopId);
      navigate(`/product/${slugify(itemName)}/${itemId}`);
    }
  };

  const handleViewAll = () => {
    if (shopId) {
      createPublicSession(shopId);
      navigate('/menu');
    }
  };

  return (
    <section className="product-grid">
      <div className="product-grid__header">
        <div>
          <p className="product-grid__label">Hand-picked for you</p>
          <h2 className="product-grid__title">Featured Products</h2>
        </div>
        <button onClick={handleViewAll} className="product-grid__view-all">
          View All →
        </button>
      </div>
      <div className="product-grid__items">
        {items.map((item) => (
          <div
            key={item.id}
            className="product-card"
            onClick={() => handleProductClick(item.id, item.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleProductClick(item.id, item.name)}
          >
            <div className="product-card__image">
              {item.image_url ? (
                <img
                  src={getThumbnailUrl(item.image_url)}
                  alt={item.name}
                  className="product-card__img"
                  loading="lazy"
                />
              ) : (
                <span className="product-card__emoji">{categoryEmoji(item.category || item.name)}</span>
              )}
              {item.category && (
                <span className="product-card__category">{item.category}</span>
              )}
            </div>
            <div className="product-card__info">
              <h3 className="product-card__name">{item.name}</h3>
              {item.description && (
                <p className="product-card__desc">{item.description}</p>
              )}
              <div className="product-card__footer">
                <p className="product-card__price">KSh {item.price}</p>
                <span className="product-card__cta">View →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
