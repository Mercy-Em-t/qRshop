import { Route } from "react-router-dom";
import QrAccessGuard from "../components/QrAccessGuard";
import OfflineMenuWrapper from "../components/OfflineMenuWrapper";
import Menu from "../pages/Menu";
import CartPage from "../pages/CartPage";
import Order from "../pages/Order";
import Campaign from "../pages/Campaign";
import TrackOrder from "../pages/TrackOrder";
import EditOrder from "../pages/EditOrder";
import MyOrders from "../pages/MyOrders";

export default function CustomerRoutes() {
  return (
    <>
      <Route
        path="/menu"
        element={
          <QrAccessGuard>
            <OfflineMenuWrapper>
              <Menu />
            </OfflineMenuWrapper>
          </QrAccessGuard>
        }
      />
      <Route
        path="/cart"
        element={
          <QrAccessGuard>
            <CartPage />
          </QrAccessGuard>
        }
      />
      <Route
        path="/order"
        element={
          <QrAccessGuard>
            <Order />
          </QrAccessGuard>
        }
      />
      <Route
        path="/campaign"
        element={
          <QrAccessGuard>
            <Campaign />
          </QrAccessGuard>
        }
      />
      <Route
        path="/track/:orderId"
        element={
          <QrAccessGuard>
            <TrackOrder />
          </QrAccessGuard>
        }
      />
      <Route
        path="/edit/:orderId"
        element={
          <QrAccessGuard>
            <EditOrder />
          </QrAccessGuard>
        }
      />
      <Route
        path="/history"
        element={
          <QrAccessGuard>
            <MyOrders />
          </QrAccessGuard>
        }
      />
    </>
  );
}
