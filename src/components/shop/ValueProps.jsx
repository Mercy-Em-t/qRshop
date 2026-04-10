import './ValueProps.css';

export default function ValueProps({ props = [] }) {
  const displayProps = props.length > 0 ? props : [
    { id: '1', title: 'Fresh Quality', text: 'We source locally for the best taste.', emoji: '🥗' },
    { id: '2', title: 'Fast Delivery', text: 'Straight to your door in minutes.', emoji: '🛵' },
    { id: '3', title: 'Secure Payment', text: 'Encrypted M-Pesa transactions.', emoji: '🔒' }
  ];

  return (
    <section className="value-props">
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
