import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth"; 

// --- WAGMI IMPORTS ---
import { WagmiProvider, createConfig, http } from 'wagmi';
import { moonbaseAlpha } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- PAGE IMPORTS ---
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateProfilePage from "./pages/CreateProfilePage";
import MyProfilePage from "./pages/MyProfilePage";
import CollectiblesPage from "./pages/CollectiblesPage";
import SettingsPage from "./pages/SettingsPage";

// Wagmi config for Moonbase Alpha testnet
const config = createConfig({
  chains: [moonbaseAlpha],
  multiInjectedProviderDiscovery: true,
  transports: {
    [moonbaseAlpha.id]: http('https://rpc.api.moonbase.moonbeam.network'),
  },
});
const queryClient = new QueryClient();


// ... (LoadingSpinner component is the same)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
    Loading...
  </div>
);


// --- PrivateRoute is the same ---
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
};

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          
          <Route path="/create-profile">
            <PrivateRoute>
              <CreateProfilePage />
            </PrivateRoute>
          </Route>

          <Route path="/dashboard">
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          </Route>

          <Route path="/profile">
            <PrivateRoute>
              <MyProfilePage />
            </PrivateRoute>
          </Route>

          <Route path="/collectibles">
            <PrivateRoute>
              <CollectiblesPage />
            </PrivateRoute>
          </Route>

          <Route path="/settings">
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          </Route>
          
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
