import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Identity */}
          <div className="col-span-2">
            <Logo className="h-10 w-10" textClassName="text-xl font-black italic tracking-tighter" />
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed mt-4">
              The expansive Commerce OS built for the African Savannah and the global market. Digitizing native trade, one node at a time.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/explore" className="hover:text-safari-green transition">Discovery</Link></li>
              <li><Link to="/community" className="hover:text-safari-green transition">Community</Link></li>
              <li><Link to="/request-access" className="hover:text-safari-green transition">Create Shop</Link></li>
              <li><Link to="/advertise" className="hover:text-safari-green font-bold text-savannah-ochre transition">Advertise</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Savannah</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/about" className="hover:text-safari-green transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-safari-green transition">Contact</Link></li>
              <li><Link to="/terms" className="hover:text-safari-green transition">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-safari-green transition">Privacy</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-gray-900 text-sm mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-safari-green transition">Instagram</a></li>
              <li><a href="#" className="hover:text-safari-green transition">X (Twitter)</a></li>
              <li><a href="#" className="hover:text-safari-green transition">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 font-medium">
            © {currentYear} The Modern Savannah Ltd. <span className="mx-2">•</span> Africa to the World.
          </p>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">System Functional</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
