import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getQrNode } from "../services/qr-node-service";
import { getShop } from "../services/shop-service";
import { getCampaignById } from "../services/campaign-service";

export default function PublicQrLanding() {
  const { qrId } = useParams();
  const [node, setNode] = useState(null);
  const [shop, setShop] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const qrData = await getQrNode(qrId);
        if (!qrData || qrData.status !== "active") {
          setError("QR code is unavailable.");
          setLoading(false);
          return;
        }
        setNode(qrData);

        const shopData = await getShop(qrData.shop_id);
        setShop(shopData);

        if (qrData.campaign_id) {
           const campData = await getCampaignById(qrData.campaign_id);
           setCampaign(campData);
        }

        if (shopData) {
           document.title = campaign 
              ? `${campaign.name} at ${shopData.shop_name}` 
              : `Visit ${shopData.shop_name} - Scan to Order`;
        }
      } catch (err) {
        setError("Error loading QR landing page.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [qrId, campaign]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">QR Unavailable</h1>
        <p className="text-gray-500 mb-6">{error || "This location could not be verified."}</p>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Go Home</Link>
      </div>
    );
  }

  // Generate Rich Snippets
  let jsonLd = {};

  if (campaign) {
    // If it's a campaign, tell Google it's an Offer or Promotion Event
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "SaleEvent",
      "name": campaign.name,
      "description": `Redeem ${campaign.reward_value} ${campaign.reward_type === 'percentage' ? '%' : 'KSh'} off at ${shop.shop_name}!`,
      "startDate": campaign.start_date || new Date().toISOString(),
      "endDate": campaign.end_date || new Date(Date.now() + 86400000 * 30).toISOString(),
      "location": {
        "@type": "Place",
        "name": shop.shop_name,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Nairobi",
          "addressRegion": "KE"
        }
      },
      "url": `https://www.shopqrplatform.com/qr/${qrId}`
    };
  } else {
    // Otherwise it's just a local business / service entry point
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": `Order at ${shop.shop_name}`,
      "description": `Scan this QR code to view the menu and order at ${shop.shop_name}.`,
      "url": `https://www.shopqrplatform.com/qr/${qrId}`,
      "publisher": {
         "@type": "LocalBusiness",
         "name": shop.shop_name
      }
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Search Engine Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 text-center relative">
        <div className="bg-indigo-600 h-32 w-full absolute top-0 left-0 z-0"></div>
        
        <div className="relative z-10 pt-16 px-6 pb-8">
           <div className="w-24 h-24 bg-white shadow-lg text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-extrabold border-4 border-gray-50">
             {shop.shop_name.charAt(0).toUpperCase()}
           </div>
           
           <h1 className="text-2xl font-extrabold text-gray-800 mb-1">{shop.shop_name}</h1>
           
           {campaign ? (
              <div className="my-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                 <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest block w-max mx-auto mb-3">Active Offer</span>
                 <h2 className="text-xl font-bold text-indigo-900 mb-1">{campaign.name}</h2>
                 <p className="text-indigo-700 font-medium">Claim your {campaign.reward_value}{campaign.reward_type === 'percentage' ? '%' : 'KSh'} reward instantly!</p>
              </div>
           ) : (
              <div className="my-6">
                 <h2 className="text-xl font-semibold text-gray-700 mb-2">Smart Menu & Ordering</h2>
                 <p className="text-gray-500 text-sm px-4">Skip the line and order directly from your table using our digital menu platform.</p>
              </div>
           )}

           <div className="mt-8">
              <a 
                href={`/q/${qrId}`} 
                className="block w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-gray-200 transition-transform transform hover:-translate-y-1"
              >
                {campaign ? "Claim Offer Now" : "View Menu & Order"}
              </a>
           </div>
           
           <div className="mt-6 text-gray-400 text-xs">
              Powered by ShopQR Platform
           </div>
        </div>
      </div>
    </div>
  );
}
