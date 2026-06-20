import { Route } from "react-router-dom";
import OnboardingGate from "../components/OnboardingGate";
import MenuManager from "../pages/MenuManager";
import QrGenerator from "../pages/QrGenerator";
import Plans from "../pages/Plans";

export default function OperatorRoutes() {
  return (
    <>
      <Route path="/menu-manager" element={<OnboardingGate><MenuManager /></OnboardingGate>} />
      <Route path="/qr-generator" element={<OnboardingGate><QrGenerator /></OnboardingGate>} />
      <Route path="/plans" element={<OnboardingGate><Plans /></OnboardingGate>} />
    </>
  );
}
