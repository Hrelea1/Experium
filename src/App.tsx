import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import ExperienceDetail from "./pages/ExperienceDetail";
import CategorySearch from "./pages/CategorySearch";
import Auth from "./pages/Auth";
import MyVouchers from "./pages/MyVouchers";
import MyBookings from "./pages/MyBookings";
import RedeemVoucher from "./pages/RedeemVoucher";
import CreateTestVoucher from "./pages/CreateTestVoucher";
import GrantAdminAccess from "./pages/GrantAdminAccess";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageExperiences from "./pages/admin/ManageExperiences";
import ManageBookings from "./pages/admin/ManageBookings";
import ManageOrders from "./pages/admin/ManageOrders";
import NotFound from "./pages/NotFound";
import { ScrollToTop } from "./components/ScrollToTop";
import { DemoPopup } from "./components/DemoPopup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <ScrollToTop />
          <DemoPopup />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/experience/:id" element={<ExperienceDetail />} />
            <Route path="/category/:category" element={<CategorySearch />} />
            <Route path="/my-vouchers" element={<MyVouchers />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/redeem-voucher" element={<RedeemVoucher />} />
            <Route path="/create-test-voucher" element={<CreateTestVoucher />} />
            <Route path="/grant-admin-access" element={<GrantAdminAccess />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/experiences" element={<ManageExperiences />} />
            <Route path="/admin/bookings" element={<ManageBookings />} />
            <Route path="/admin/orders" element={<ManageOrders />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
