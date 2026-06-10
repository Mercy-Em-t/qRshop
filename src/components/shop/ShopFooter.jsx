import './ShopFooter.css';

export default function ShopFooter({ shop }) {
  const currentYear = new Date().getFullYear();
  const phone = (shop?.whatsapp_number || shop?.phone || '').replace(/[^0-9]/g, '');

  return (
    <footer className="shop-footer">
      <div className="shop-footer__inner">
        {/* Brand Block */}
        <div className="shop-footer__brand">
          {shop?.logo_url && (
            <img src={shop.logo_url} alt={shop.name} className="shop-footer__logo" />
          )}
          <h2 className="shop-footer__name">{shop?.name || 'Modern Savannah'}</h2>
          <p className="shop-footer__tagline">{shop?.tagline || 'Secure WhatsApp Ordering'}</p>
          {shop?.industry_type && (
            <span className="shop-footer__industry">{shop.industry_type}</span>
          )}
        </div>

        {/* Contact Block */}
        <div className="shop-footer__contact">
          <p className="shop-footer__section-label">Get In Touch</p>
          {phone && (
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" className="shop-footer__wa-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp Us
            </a>
          )}
          {shop?.phone && (
            <a href={`tel:${shop.phone}`} className="shop-footer__link">📞 {shop.phone}</a>
          )}
          {shop?.email && (
            <a href={`mailto:${shop.email}`} className="shop-footer__link">📩 {shop.email}</a>
          )}
          {shop?.address && (
            <p className="shop-footer__link">📍 {shop.address}</p>
          )}
        </div>

        {/* Payment Block */}
        <div className="shop-footer__payments">
          <p className="shop-footer__section-label">Supported Payments</p>
          {shop?.fulfillment_settings?.c2b_payment_instructions || shop?.fulfillment_settings?.b2b_payment_instructions ? (
            <>
              {shop?.fulfillment_settings?.c2b_payment_instructions && (
                <div className="shop-footer__payment-item mb-3">
                  <span style={{ fontSize: '9px' }} className="text-slate-400 block font-bold uppercase tracking-wider mb-1">Retail Payment Instructions</span>
                  <span className="text-xs font-medium text-slate-300">{shop.fulfillment_settings.c2b_payment_instructions}</span>
                </div>
              )}
              {shop?.fulfillment_settings?.b2b_payment_instructions && (
                <div className="shop-footer__payment-item mb-3">
                  <span style={{ fontSize: '9px' }} className="text-slate-400 block font-bold uppercase tracking-wider mb-1">Wholesale Payment Instructions</span>
                  <span className="text-xs font-medium text-slate-300">{shop.fulfillment_settings.b2b_payment_instructions}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {(shop?.mpesa_till_number || shop?.mpesa_shortcode) ? (
                <div className="shop-footer__payment-item flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-[10px] shadow-sm">
                     M
                  </div>
                  <div>
                     <span className="text-sm font-black text-emerald-400 tracking-wider block">M-Pesa Accepted</span>
                     <span style={{ fontSize: '9px' }} className="text-slate-400 font-bold uppercase tracking-wider">Secure Payment</span>
                  </div>
                </div>
              ) : (
                <div className="shop-footer__payment-item">
                  <span style={{ fontSize: '9px' }} className="text-slate-400 block font-bold uppercase tracking-wider mb-1">Payment Method</span>
                  <span className="text-xs font-black text-slate-300">📞 Send to Phone: {shop?.phone || shop?.whatsapp_number || 'Contact Shop'}</span>
                </div>
              )}
            </>
          )}
          {shop?.payment_mode && (
             <span className="inline-block mt-2 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                Mode: {shop.payment_mode}
             </span>
          )}
        </div>
      </div>

      <div className="shop-footer__bottom">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <p>© {currentYear} {shop?.name}. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#64748b' }}>
            <a href={`/s/${shop?.slug || shop?.shop_id || shop?.id}/about`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = '#f8fafc'} onMouseOut={e => e.target.style.color = 'inherit'}>About Us</a>
            <span>|</span>
            <a href={`/s/${shop?.slug || shop?.shop_id || shop?.id}/returns`} style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = '#f8fafc'} onMouseOut={e => e.target.style.color = 'inherit'}>Returns Policy</a>
            <span>|</span>
            <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = '#f8fafc'} onMouseOut={e => e.target.style.color = 'inherit'}>Privacy Policy</a>
            <span>|</span>
            <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = '#f8fafc'} onMouseOut={e => e.target.style.color = 'inherit'}>Terms</a>
          </div>
        </div>
        <p className="shop-footer__attribution">
          Powered by{' '}
          <a href="https://tmsavannah.com" target="_blank" rel="noopener noreferrer" className="shop-footer__attr-link">
            TM Savannah
          </a>
        </p>
      </div>
    </footer>
  );
}
