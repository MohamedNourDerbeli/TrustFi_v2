import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout";
import { AppRoutes } from "./routes";
import { ErrorBoundary } from "./components/shared";

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster />
        <Layout>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
