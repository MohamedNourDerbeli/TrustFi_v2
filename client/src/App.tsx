import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout";
import { AppRoutes } from "./routes";

const App: React.FC = () => {
  return (
    <Router>
      <Toaster />
      <Layout>
        <AppRoutes />
      </Layout>
    </Router>
  );
};

export default App;
