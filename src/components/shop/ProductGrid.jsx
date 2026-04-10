import { useNavigate } from 'react-router-dom';
import './ProductGrid.css';

export default function ProductGrid({ items = [], shopId }) {
  if (items.length === 0) return null;

  return (
    <section className="product-grid">
      <h2 className="product-grid__title">Featured Products</h2>
      <div className="product-grid__items">
        {items.map((item) => (
          <div key={item.id} className="product-card">
            <div className="product-card__image">
              <span className="product-card__emoji">{item.emoji || '📦'}</span>
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
