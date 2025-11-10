import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import PublicProfile from "@/pages/PublicProfile";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import PrivacySettingsPage from "@/pages/PrivacySettingsPage";
import Search from "@/pages/Search";
import Issuer from "@/pages/Issuer";
import Admin from "@/pages/Admin";
import CollectiblesGallery from "@/pages/CollectiblesGallery";
import VerifyCard from "@/pages/VerifyCard";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={Search} />
      <Route path="/collectibles" component={CollectiblesGallery} />
      <Route path="/verify/:chainId/:contractAddress/:cardId" component={VerifyCard} />
      <Route path="/settings/profile">
        <ProtectedRoute>
          <ProfileSettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/settings/privacy">
        <ProtectedRoute>
          <PrivacySettingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/issuer">
        <ProtectedRoute requireIssuer>
          <Issuer />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute requireAdmin>
          <Admin />
        </ProtectedRoute>
      </Route>
      <Route path="/:address" component={PublicProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ReactQueryDevtools initialIsOpen={false} />
          </TooltipProvider>
        </ProfileProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
