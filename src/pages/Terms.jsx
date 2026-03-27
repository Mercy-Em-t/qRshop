import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-50 px-4 h-16 flex items-center">
        <Link to="/" className="font-black text-xl text-safari-green italic">Modern Savannah</Link>
      </nav>
      <main className="max-w-3xl mx-auto px-4 py-20 prose prose-slate">
        <h1 className="text-4xl font-black mb-8 italic">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last Updated: March 27, 2026</p>
        
        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">1. Acceptance</h3>
        <p className="text-gray-600 mb-6">By using The Modern Savannah platform, you agree to these terms. We provide a peer-to-peer commerce operating system connecting shops, suppliers, and customers.</p>
        
        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">2. Merchant Responsibility</h3>
        <p className="text-gray-600 mb-6">Merchants are responsible for the quality, legality, and delivery of their products. The platform acts as an infrastructure provider and escrow mediator where applicable.</p>

        <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">3. Payments</h3>
        <p className="text-gray-600 mb-6">All payments flow through M-Pesa. Modern Savannah may hold funds in escrow until fulfillment is confirmed to ensure platform trust.</p>
      </main>
      <Footer />
    </div>
  );
}
