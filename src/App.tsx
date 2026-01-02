import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ForcePasswordChange } from "./components/ForcePasswordChange";
import { FloatingChat } from "./components/chat/FloatingChat";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ClientProfile from "./pages/ClientProfile";
import UserProfile from "./pages/UserProfile";
import Giveaways from "./pages/Giveaways";
import ForgotPassword from "./pages/ForgotPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper to check for forced password change
const AppContent = () => {
  const { user, requiresPasswordChange, clearPasswordChangeRequirement, refreshProfile } = useAuth();

  // If user needs to change password, show only that screen
  if (user && requiresPasswordChange) {
    return (
      <ForcePasswordChange 
        userId={user.id} 
        onPasswordChanged={() => {
          clearPasswordChangeRequirement();
          refreshProfile();
        }} 
      />
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/client/:id" element={<ClientProfile />} />
        <Route path="/user" element={<UserProfile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/giveaways" element={<Giveaways />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FloatingChat />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
