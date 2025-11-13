import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "./hooks/useAuth"; 

// --- WAGMI IMPORTS ---
import { WagmiProvider, createConfig, http } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- PAGE IMPORTS ---
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CreateProfilePage from "./pages/CreateProfilePage";
import MyProfilePage from "./pages/MyProfilePage";
import CollectiblesPage from "./pages/CollectiblesPage";

// Wagmi config for localhost Hardhat network
const config = createConfig({
  chains: [localhost],
  multiInjectedProviderDiscovery: true,
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
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
          
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
