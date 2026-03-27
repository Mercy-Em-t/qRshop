import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-50 px-4 h-16 flex items-center">
        <Link to="/" className="font-black text-xl text-safari-green italic">Modern Savannah</Link>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-20 prose prose-slate">
        <h1 className="text-4xl font-black mb-8 italic">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last Updated: March 27, 2026</p>
        
        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">1. Information We Collect</h3>
        <p className="text-gray-600 mb-6">We collect names, phone numbers, and location data to facilitate commerce nodes. For delivery, we collect email addresses for order confirmation.</p>
        
        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">2. The Privacy Guard</h3>
        <p className="text-gray-600 mb-6">We implement "Privacy Guard" logic: your phone number is masked from merchants until the point of fulfillment to prevent promotional spamming.</p>

        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">3. Data Security</h3>
        <p className="text-gray-600 mb-6">Your data is stored securely in Supabase with strict Row-Level Security. We never sell your data to third-party ad networks.</p>
      </main>
      <Footer />
    </div>
  );
}
