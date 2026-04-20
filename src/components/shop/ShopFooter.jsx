import './ShopFooter.css';

export default function ShopFooter({ shop }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <h2 className="footer__name">{shop?.name || "Modern Savannah"}</h2>
          <p className="footer__tagline">{shop?.tagline || "Secure WhatsApp Ordering"}</p>
        </div>
        <div className="footer__contact">
          <p>📞 {shop?.phone || "+254 ..."}</p>
          <p>📩 CONTACT SUPPORT</p>
        </div>
      </div>
      <div className="footer__bottom">
        <p>© {currentYear} {shop?.name}. All rights reserved.</p>
        <p className="footer__attribution">Build your own shop at <a href="https://tmsavannah.com" className="font-bold underline decoration-amber-500">tmsavannah.com</a></p>
      </div>
    </footer>
  );
}
