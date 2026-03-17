import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-green-600 tracking-tight flex items-center gap-1">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
               <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 10-2 0v1h-1a1 1 0 100 2h2a1 1 0 001-1v-2z" />
             </svg>
             Savannah
          </Link>
          <Link to="/" className="text-gray-500 hover:text-green-600 font-medium transition cursor-pointer">
             Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-green lg:prose-lg mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Terms of Service</h1>
          
          <div className="space-y-8 text-gray-700 leading-relaxed">
             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                <p>Welcome to <strong>Savannah Platform</strong> (“we”, “our”, “the platform”). We provide a system that enables customers to send structured orders to businesses via WhatsApp or related channels.</p>
                <p className="mt-2">By using our platform, you agree to these Terms.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. What We Do (Important)</h2>
                <p>Our platform:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                   <li>Facilitates <strong>order creation and transmission</strong>.</li>
                   <li>Structures order information for businesses.</li>
                   <li>Connects customers to businesses via messaging channels.</li>
                </ul>
                <p className="mt-4 font-bold text-red-600">We do NOT:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2 text-gray-600">
                   <li>Prepare, fulfill, or deliver orders.</li>
                   <li>Process or hold payments.</li>
                   <li>Guarantee product availability or quality.</li>
                </ul>
                <div className="mt-4 p-4 bg-orange-50 text-orange-800 rounded-lg border border-orange-100 font-medium">
                   👉 The business you order from is fully responsible for fulfilling your order.
                </div>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Responsibilities</h2>
                <h3 className="font-bold text-gray-800 mt-4 mb-2">Customers:</h3>
                <ul className="list-disc pl-6 space-y-1">
                   <li>Provide accurate name and phone number.</li>
                   <li>Review orders before submitting.</li>
                   <li>Communicate directly with the business for any issues.</li>
                </ul>
                
                <h3 className="font-bold text-gray-800 mt-6 mb-2">Businesses:</h3>
                <ul className="list-disc pl-6 space-y-1">
                   <li>Ensure orders are handled promptly.</li>
                   <li>Confirm availability before requesting payment.</li>
                   <li>Provide correct payment instructions directly to clients.</li>
                   <li>Deliver goods/services as agreed.</li>
                   <li>Use customer data received strictly for order fulfillment, not for unsolicited marketing without consent.</li>
                </ul>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Orders & Revisions</h2>
                <ul className="list-disc pl-6 space-y-1">
                   <li>Orders submitted may be revised by the shop or customer if items are unavailable.</li>
                   <li>Revised orders are linked to original orders for tracking.</li>
                   <li>The most recent version of an order is considered the <strong>active order</strong>.</li>
                </ul>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Payments</h2>
                <ul className="list-disc pl-6 space-y-1">
                   <li>Payments are handled <strong>directly between the customer and the business</strong>.</li>
                   <li>We do not collect payments, hold funds, or mediate financial disputes.</li>
                </ul>
                <div className="mt-4 p-4 bg-gray-50 text-gray-600 rounded-lg border border-gray-200">
                   👉 Any payment disputes must be resolved directly between the customer and the business entity.
                </div>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Availability & Reliability</h2>
                <p>We aim to provide a reliable service, but we do not guarantee message delivery at all times or system uptime without interruptions due to third-party network dependencies (e.g. Meta/WhatsApp).</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
                <p>We are not liable for incorrect or incomplete orders, product or service quality, payment disputes, or losses arising from business interactions.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Termination & Changes</h2>
                <p>We reserve the right to suspend or terminate access / restrict usage for misuse or abuse. We may update these Terms at any time. Continued use means you accept the updates.</p>
             </section>

             <section className="border-t pt-8 mt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Contact Us</h2>
                <p>For support or inquiries regarding these terms:</p>
                <p className="mt-2 text-green-700 font-medium">📧 legal@tmsavannah.com</p>
                <p className="mt-1 text-green-700 font-medium">📞 +254 (0) 700 000 000</p>
             </section>
          </div>
        </article>
      </main>
    </div>
  );
}
