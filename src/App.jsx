import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { OrderProvider } from "./contexts/OrderContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerPage from "./pages/CustomerPage";
import CashierPage from "./pages/CashierPage";
import KitchenPage from "./pages/KitchenPage";
import AdminPage from "./pages/AdminPage";
import ReportsPage from "./pages/ReportsPage";

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <OrderProvider>
            <Toaster position="bottom-center" />
            <Routes>
              <Route path="/" element={<CustomerPage />} />
              <Route path="/table/:tableNumber" element={<CustomerPage />} />
              <Route path="/cashier" element={<ProtectedRoute roles={["cashier","admin"]}><CashierPage /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute roles={["kitchen","admin"]}><KitchenPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute roles={["admin"]}><ReportsPage /></ProtectedRoute>} />
            </Routes>
          </OrderProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
export default App;
