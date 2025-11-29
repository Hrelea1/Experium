import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import ExperienceDetail from "./pages/ExperienceDetail";
import CategorySearch from "./pages/CategorySearch";
import MapView from "./pages/MapView";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MyVouchers from "./pages/MyVouchers";
import MyBookings from "./pages/MyBookings";
import RedeemVoucher from "./pages/RedeemVoucher";
import VoucherConfirmation from "./pages/VoucherConfirmation";
import CreateTestVoucher from "./pages/CreateTestVoucher";
import Cart from "./pages/Cart";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageExperiences from "./pages/admin/ManageExperiences";
import ManageBookings from "./pages/admin/ManageBookings";
import ManageOrders from "./pages/admin/ManageOrders";
import ManageRoles from "./pages/admin/ManageRoles";
import ExperienceBuilder from "./pages/admin/ExperienceBuilder";
import VoucherBuilder from "./pages/admin/VoucherBuilder";
import ContentEditor from "./pages/admin/ContentEditor";
import ContentAudit from "./pages/admin/ContentAudit";
import NotFound from "./pages/NotFound";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/experience/:id" element={<ExperienceDetail />} />
            <Route path="/category/:category" element={<CategorySearch />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/my-vouchers" element={<MyVouchers />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/redeem-voucher" element={<RedeemVoucher />} />
            <Route path="/voucher-confirmation" element={<VoucherConfirmation />} />
            <Route path="/cart" element={<Cart />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<ContentEditor />} />
            <Route path="/admin/content/audit" element={<ContentAudit />} />
            <Route path="/admin/experiences" element={<ManageExperiences />} />
            <Route path="/admin/experiences/create" element={<ExperienceBuilder />} />
            <Route path="/admin/bookings" element={<ManageBookings />} />
            <Route path="/admin/orders" element={<ManageOrders />} />
            <Route path="/admin/orders/create" element={<VoucherBuilder />} />
            <Route path="/admin/roles" element={<ManageRoles />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
