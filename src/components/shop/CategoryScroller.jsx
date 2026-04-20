import { useNavigate, useParams } from 'react-router-dom';
import { createPublicSession } from '../../utils/qr-session';
import './CategoryScroller.css';

export default function CategoryScroller({ categories = [], shopId: propShopId }) {
  const navigate = useNavigate();
  const params = useParams();
  const shopId = propShopId || params.shopId;

  const displayCategories = categories.length > 0 ? categories : [
    { id: 'all', name: 'All Products', emoji: '🛍️' },
    { id: 'offers', name: 'Daily Offers', emoji: '🔥' }
  ];

  const handleCategoryClick = (categoryName) => {
    if (shopId) {
      createPublicSession(shopId);
      navigate(`/menu?category=${encodeURIComponent(categoryName)}`);
    } else {
      navigate('/error'); // Fallback
    }
  };

  return (
    <section className="category-scroller">
      <h2 className="section-title">Shop by Category</h2>
      <div className="category-scroller__track">
        {displayCategories.map((category) => (
          <button
            key={category.id}
            className="category-card cursor-pointer"
            onClick={() => handleCategoryClick(category.name)}
          >
            <span className="category-card__icon">{category.emoji}</span>
            <span className="category-card__name">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
