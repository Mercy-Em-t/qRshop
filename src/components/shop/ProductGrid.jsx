import { useNavigate } from 'react-router-dom';
import { createPublicSession } from '../../utils/qr-session';
import './ProductGrid.css';

export default function ProductGrid({ items = [], shopId }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  const handleProductClick = (itemName) => {
    if (shopId) {
      createPublicSession(shopId);
      navigate(`/menu?search=${encodeURIComponent(itemName)}`);
    }
  };

  return (
    <section className="product-grid">
      <h2 className="product-grid__title">Featured Products</h2>
      <div className="product-grid__items">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="product-card cursor-pointer"
            onClick={() => handleProductClick(item.name)}
          >
            <div className="product-card__image">
               {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onLoad={(e) => e.target.classList.remove('opacity-0')}
                  />
               ) : (
                  <span className="product-card__emoji">{item.emoji || '📦'}</span>
               )}
            </div>
            <div className="product-card__info">
              <h3 className="product-card__name">{item.name}</h3>
              <p className="product-card__price">KSh {item.price}</p>
              <div className="product-card__tags">
                {item.tags?.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
