import { Route } from "react-router-dom";
import Home from "../pages/Home";
import Enter from "../pages/Enter";
import InvalidAccess from "../pages/InvalidAccess";
import PublicShopProfile from "../pages/PublicShopProfile";
import PublicQrLanding from "../pages/PublicQrLanding";
import RequestAccess from "../pages/RequestAccess";
import AutoCart from "../pages/AutoCart";
import CommunityFeed from "../pages/social/CommunityFeed";
import Directory from "../pages/social/Directory";
import Terms from '../pages/Terms';
import Privacy from '../pages/Privacy';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Advertise from '../pages/Advertise';
import ScanGateway from "../pages/ScanGateway";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import SupplierSignup from "../pages/SupplierSignup";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />
      <Route path="/s/:identifier" element={<PublicShopProfile />} />
      <Route path="/q/:identifier" element={<ScanGateway />} />
      <Route path="/shops/:shopId" element={<PublicShopProfile />} />
      <Route path="/qr/:qrId" element={<PublicQrLanding />} />
      <Route path="/request-access" element={<RequestAccess />} />
      <Route path="/buy/:itemName" element={<AutoCart />} />
      <Route path="/buy" element={<AutoCart />} />
      <Route path="/auto-cart" element={<AutoCart />} />
      <Route path="/community" element={<CommunityFeed />} />
      <Route path="/explore" element={<Directory />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/advertise" element={<Advertise />} />
      <Route path="/q/:qrId" element={<ScanGateway />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/join/distribution-network" element={<SupplierSignup />} />
    </Routes>
  );
}
