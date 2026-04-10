import { useNavigate } from 'react-router-dom';
import './CategoryScroller.css';

export default function CategoryScroller({ categories = [] }) {
  const navigate = useNavigate();
  const displayCategories = categories.length > 0 ? categories : [
    { id: 'all', name: 'All Products', emoji: '🛍️' },
    { id: 'offers', name: 'Daily Offers', emoji: '🔥' }
  ];

  return (
    <section className="category-scroller">
      <h2 className="section-title">Shop by Category</h2>
      <div className="category-scroller__track">
        {displayCategories.map((category) => (
          <button
            key={category.id}
            className="category-card"
            onClick={() => navigate(`/menu?category=${encodeURIComponent(category.name)}`)}
          >
            <span className="category-card__icon">{category.emoji}</span>
            <span className="category-card__name">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
