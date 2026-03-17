import { Link } from "react-router-dom";

export default function Privacy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-700 leading-relaxed">
             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
                <p>We may collect the following data when you interact with our platform:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                   <li>Name</li>
                   <li>Phone number</li>
                   <li>Order details (items, totals, timestamps)</li>
                </ul>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Information</h2>
                <p>We use this data specifically to:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                   <li>Create and send orders to businesses.</li>
                   <li>Improve system performance and routing.</li>
                   <li>Maintain order records and business analytics.</li>
                </ul>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Sharing</h2>
                <p>We share customer data exclusively with:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2 mb-4">
                   <li><strong>The selected business</strong> (to enable them to fulfill your order and request payment).</li>
                </ul>
                <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-100 font-medium">
                   ✅ We do NOT sell or rent your data to third parties.
                </div>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Storage</h2>
                <ul className="list-disc pl-6 space-y-1">
                   <li>Order data is stored securely in our cloud infrastructure.</li>
                   <li>Previous order versions may be retained for analytics and system improvement.</li>
                </ul>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. User Control</h2>
                <p>Users maintain control over their data footprint and may:</p>
                <ul className="list-disc pl-6 space-y-1 mt-2">
                   <li>Request deletion of their data trace.</li>
                   <li>Contact us directly for data-related inquiries.</li>
                </ul>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Security</h2>
                <p>We take reasonable and modern cryptographic steps to protect your data across our cloud services, but please note no digital system or network connection is 100% secure.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Updates</h2>
                <p>We may update this Privacy Policy as our platform infrastructure evolves. Continued use implies acceptance of the newly deployed policies.</p>
             </section>

             <section className="border-t pt-8 mt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Contact Us</h2>
                <p>For data removal requests or legal inquiries:</p>
                <p className="mt-2 text-green-700 font-medium">📧 privacy@tmsavannah.com</p>
                <p className="mt-1 text-green-700 font-medium">📞 +254 (0) 700 000 000</p>
             </section>
          </div>
        </article>
      </main>
    </div>
  );
}
