import { useNavigate } from 'react-router-dom';
import { createPublicSession } from '../../utils/qr-session';
import './CategoryScroller.css';

// Maps category names to relevant emojis — same logic as ProductGrid
const categoryEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('all') || n.includes('everything')) return '🛍️';
  if (n.includes('offer') || n.includes('deal') || n.includes('sale') || n.includes('promo')) return '🔥';
  if (n.includes('new') || n.includes('latest') || n.includes('fresh')) return '✨';
  if (n.includes('popular') || n.includes('bestsell') || n.includes('top')) return '⭐';
  if (n.includes('burger') || n.includes('sandwich')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('drink') || n.includes('beverage') || n.includes('juice')) return '🥤';
  if (n.includes('coffee') || n.includes('tea') || n.includes('cafe')) return '☕';
  if (n.includes('rice') || n.includes('meal') || n.includes('main') || n.includes('food')) return '🍽️';
  if (n.includes('snack') || n.includes('chips') || n.includes('fries')) return '🍟';
  if (n.includes('dessert') || n.includes('cake') || n.includes('sweet') || n.includes('pastry')) return '🍰';
  if (n.includes('chicken') || n.includes('poultry')) return '🍗';
  if (n.includes('meat') || n.includes('beef') || n.includes('pork')) return '🥩';
  if (n.includes('salad') || n.includes('veggie') || n.includes('vegetable')) return '🥗';
  if (n.includes('fish') || n.includes('seafood') || n.includes('sushi')) return '🐟';
  if (n.includes('bread') || n.includes('bakery') || n.includes('baked')) return '🥖';
  if (n.includes('fruit')) return '🍎';
  if (n.includes('dairy') || n.includes('milk') || n.includes('cheese')) return '🥛';
  if (n.includes('grocery') || n.includes('groceries') || n.includes('pantry')) return '🛒';
  if (n.includes('shirt') || n.includes('top') || n.includes('tee') || n.includes('blouse')) return '👕';
  if (n.includes('trouser') || n.includes('pant') || n.includes('jeans')) return '👖';
  if (n.includes('shoe') || n.includes('boot') || n.includes('sneaker') || n.includes('footwear')) return '👟';
  if (n.includes('dress') || n.includes('gown') || n.includes('skirt')) return '👗';
  if (n.includes('bag') || n.includes('handbag') || n.includes('purse') || n.includes('clutch')) return '👜';
  if (n.includes('hat') || n.includes('cap') || n.includes('beanie')) return '🧢';
  if (n.includes('jacket') || n.includes('coat') || n.includes('hoodie') || n.includes('sweater')) return '🧥';
  if (n.includes('jewel') || n.includes('necklace') || n.includes('ring') || n.includes('bracelet')) return '💎';
  if (n.includes('watch') || n.includes('accessory') || n.includes('accessories')) return '⌚';
  if (n.includes('electronics') || n.includes('tech') || n.includes('gadget')) return '📱';
  if (n.includes('laptop') || n.includes('computer') || n.includes('pc')) return '💻';
  if (n.includes('beauty') || n.includes('skincare') || n.includes('cosmetic')) return '💄';
  if (n.includes('health') || n.includes('wellness') || n.includes('supplement')) return '💊';
  if (n.includes('home') || n.includes('household') || n.includes('kitchen')) return '🏠';
  if (n.includes('baby') || n.includes('kids') || n.includes('children') || n.includes('toy')) return '🧸';
  if (n.includes('sport') || n.includes('fitness') || n.includes('gym')) return '🏋️';
  if (n.includes('book') || n.includes('stationery') || n.includes('office')) return '📚';
  if (n.includes('pet') || n.includes('animal')) return '🐾';
  if (n.includes('automotive') || n.includes('car') || n.includes('vehicle')) return '🚗';
  return '📦';
};

export default function CategoryScroller({ categories = [], shopId: propShopId }) {
  const navigate = useNavigate();

  const displayCategories = categories.length > 0 ? categories : [
    { id: 'all', name: 'All Products', emoji: '🛍️' },
    { id: 'offers', name: 'Daily Offers', emoji: '🔥' }
  ];

  const handleCategoryClick = (categoryName) => {
    if (propShopId) {
      createPublicSession(propShopId);
      navigate(`/menu?category=${encodeURIComponent(categoryName)}`);
    }
  };

  return (
    <section className="category-scroller">
      <div className="category-scroller__header">
        <p className="category-scroller__label">What are you looking for?</p>
        <h2 className="category-scroller__title">Browse Categories</h2>
      </div>
      <div className="category-scroller__track">
        {displayCategories.map((category) => {
          const emoji = category.emoji && category.emoji !== '📦'
            ? category.emoji
            : categoryEmoji(category.name);
          return (
            <button
              key={category.id}
              className="category-card"
              onClick={() => handleCategoryClick(category.name)}
            >
              <span className="category-card__icon">{emoji}</span>
              <span className="category-card__name">{category.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
