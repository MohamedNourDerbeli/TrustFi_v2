import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import {
  HomePage,
  UserDashboard,
  DiscoverPage,
  ProfilePage,
  ProfileEditPage,
  PublicClaimPage,
  NotFoundPage,
} from "../pages";
import { LoadingSpinner } from "../components/shared";

// Lazy load admin components
const AdminDashboard = lazy(() => import("../components/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const CreateTemplate = lazy(() => import("../components/admin/CreateTemplate").then(m => ({ default: m.CreateTemplate })));
const IssuerManagement = lazy(() => import("../components/admin/IssuerManagement").then(m => ({ default: m.IssuerManagement })));
const TemplateManagement = lazy(() => import("../components/admin/TemplateManagement").then(m => ({ default: m.TemplateManagement })));

// Lazy load issuer components
const IssuerDashboard = lazy(() => import("../components/issuer/IssuerDashboard").then(m => ({ default: m.IssuerDashboard })));
const TemplateList = lazy(() => import("../components/issuer/TemplateList").then(m => ({ default: m.TemplateList })));
const IssueCardForm = lazy(() => import("../components/issuer/IssueCardForm").then(m => ({ default: m.IssueCardForm })));
const ClaimLinkGenerator = lazy(() => import("../components/issuer/ClaimLinkGenerator").then(m => ({ default: m.ClaimLinkGenerator })));

// Loading fallback component
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="large" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/claim" element={<PublicClaimPage />} />

      {/* User Routes */}
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/discover" element={<DiscoverPage />} />
      <Route path="/profile/:address" element={<ProfilePage />} />
      <Route path="/profile/edit" element={<ProfileEditPage />} />

      {/* Admin Routes - Lazy Loaded */}
      <Route 
        path="/admin" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        } 
      />
      <Route 
        path="/admin/templates" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <TemplateManagement />
          </Suspense>
        } 
      />
      <Route 
        path="/admin/templates/create" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <CreateTemplate />
          </Suspense>
        } 
      />
      <Route 
        path="/admin/issuers" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <IssuerManagement />
          </Suspense>
        } 
      />

      {/* Issuer Routes - Lazy Loaded */}
      <Route 
        path="/issuer" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <IssuerDashboard />
          </Suspense>
        } 
      />
      <Route 
        path="/issuer/templates" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <TemplateList />
          </Suspense>
        } 
      />
      <Route 
        path="/issuer/issue" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <IssueCardForm />
          </Suspense>
        } 
      />
      <Route 
        path="/issuer/claim-links" 
        element={
          <Suspense fallback={<RouteLoadingFallback />}>
            <ClaimLinkGenerator />
          </Suspense>
        } 
      />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
