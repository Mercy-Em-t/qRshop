import './ValueProps.css';

// Returns contextual trust propositions based on the shop's industry type
function getDefaultProps(industryType = '') {
  const type = industryType.toLowerCase();

  if (type.includes('restaurant') || type.includes('food') || type.includes('cafe') || type.includes('bakery')) {
    return [
      { id: '1', emoji: '🍳', title: 'Freshly Prepared', text: 'Every order is made fresh. No reheated shortcuts — ever.' },
      { id: '2', emoji: '🥬', title: 'Hygiene Certified', text: 'Our kitchen meets strict food safety standards.' },
      { id: '3', emoji: '⚡', title: 'Quick Turnaround', text: 'Hot food delivered or ready for pickup fast.' },
    ];
  }

  if (type.includes('fashion') || type.includes('clothing') || type.includes('boutique') || type.includes('apparel')) {
    return [
      { id: '1', emoji: '🧵', title: 'Premium Sourcing', text: 'Carefully selected fabrics and quality-checked pieces.' },
      { id: '2', emoji: '🛡️', title: 'Authentic Designs', text: 'No counterfeits — only genuine brand-quality items.' },
      { id: '3', emoji: '📦', title: 'Safe Packaging', text: 'Orders arrive neatly packed and protected.' },
    ];
  }

  if (type.includes('grocery') || type.includes('supermarket') || type.includes('fresh produce')) {
    return [
      { id: '1', emoji: '🌱', title: 'Farm Fresh', text: 'Sourced daily from trusted local farmers and suppliers.' },
      { id: '2', emoji: '🧼', title: 'Sanitized Handling', text: 'All produce is cleaned and handled with food-grade care.' },
      { id: '3', emoji: '🚚', title: 'Reliable Delivery', text: 'Fresh to your door — on time, every time.' },
    ];
  }

  if (type.includes('electronics') || type.includes('tech') || type.includes('gadget')) {
    return [
      { id: '1', emoji: '✅', title: 'Genuine Products', text: 'Every device is authentic and covered by warranty.' },
      { id: '2', emoji: '🔧', title: 'After-Sale Support', text: 'We\'re here for setup help and troubleshooting.' },
      { id: '3', emoji: '🔒', title: 'Secure Transactions', text: 'Encrypted payment processing on every order.' },
    ];
  }

  if (type.includes('beauty') || type.includes('salon') || type.includes('cosmetic') || type.includes('skincare')) {
    return [
      { id: '1', emoji: '💆', title: 'Expert-Curated', text: 'Products recommended by professional beauty therapists.' },
      { id: '2', emoji: '🌿', title: 'Skin-Safe Formulas', text: 'Dermatologist-tested and cruelty-free selections.' },
      { id: '3', emoji: '💝', title: 'Loyalty Rewards', text: 'Earn points on every purchase towards free products.' },
    ];
  }

  if (type.includes('health') || type.includes('pharmacy') || type.includes('wellness')) {
    return [
      { id: '1', emoji: '🏥', title: 'Certified Products', text: 'All health products are pharmacy-grade and certified.' },
      { id: '2', emoji: '🔬', title: 'Lab Verified', text: 'Third-party tested for purity and potency.' },
      { id: '3', emoji: '🔒', title: 'Discreet Delivery', text: 'Private packaging for your peace of mind.' },
    ];
  }

  // Generic / Retail default
  return [
    { id: '1', emoji: '🛡️', title: 'Quality Guaranteed', text: 'Every product is quality-checked before it reaches you.' },
    { id: '2', emoji: '🚚', title: 'Fast Delivery', text: 'Reliable delivery to your door, tracked end-to-end.' },
    { id: '3', emoji: '🔒', title: 'Secure Checkout', text: 'Encrypted M-Pesa & WhatsApp ordering. Always safe.' },
  ];
}

export default function ValueProps({ props = [], industryType = '' }) {
  const displayProps = props.length > 0 ? props : getDefaultProps(industryType);

  return (
    <section className="value-props">
      <div className="value-props__header">
        <p className="value-props__label">Why choose us</p>
        <h2 className="value-props__title">Our Promise to You</h2>
      </div>
      <div className="value-props__grid">
        {displayProps.map((prop) => (
          <div key={prop.id} className="value-item">
            <span className="value-item__emoji">{prop.emoji}</span>
            <h3 className="value-item__title">{prop.title}</h3>
            <p className="value-item__text">{prop.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
