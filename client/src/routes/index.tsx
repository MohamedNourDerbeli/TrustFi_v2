import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import {
  HomePage,
  UserDashboard,
  DiscoverPage,
  ProfilePage,
  ProfileEditPage,
  CreateProfilePage,
  PublicClaimPage,
  NotFoundPage,
} from "../pages";
import { TemplateSyncPage } from "../pages/TemplateSyncPage";
import { LoadingSpinner } from "../components/shared";
import { ProtectedRoute } from "../components/auth";

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
const ManageCollectiblesPage = lazy(() => import("../pages/ManageCollectiblesPage").then(m => ({ default: m.ManageCollectiblesPage })));

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
      <Route path="/admin/sync-templates" element={<TemplateSyncPage />} />
      <Route 
        path="/create-profile" 
        element={
          <ProtectedRoute requireNoProfile>
            <CreateProfilePage />
          </ProtectedRoute>
        } 
      />

      {/* User Routes - Require Wallet Connection */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requireProfile>
            <UserDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/discover" 
        element={
          <ProtectedRoute>
            <DiscoverPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/profile/:address" element={<ProfilePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route 
        path="/profile/edit" 
        element={
          <ProtectedRoute requireProfile>
            <ProfileEditPage />
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes - Require Admin Role */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/templates" 
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<RouteLoadingFallback />}>
              <TemplateManagement />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/templates/create" 
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<RouteLoadingFallback />}>
              <CreateTemplate />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/issuers" 
        element={
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<RouteLoadingFallback />}>
              <IssuerManagement />
            </Suspense>
          </ProtectedRoute>
        } 
      />

      {/* Issuer Routes - Require Issuer Role */}
      <Route 
        path="/issuer" 
        element={
          <ProtectedRoute requireIssuer>
            <Suspense fallback={<RouteLoadingFallback />}>
              <IssuerDashboard />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/issuer/templates" 
        element={
          <ProtectedRoute requireIssuer>
            <Suspense fallback={<RouteLoadingFallback />}>
              <TemplateList />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/issuer/issue" 
        element={
          <ProtectedRoute requireIssuer>
            <Suspense fallback={<RouteLoadingFallback />}>
              <IssueCardForm />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/issuer/claim-links" 
        element={
          <ProtectedRoute requireIssuer>
            <Suspense fallback={<RouteLoadingFallback />}>
              <ClaimLinkGenerator />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/issuer/collectibles" 
        element={
          <ProtectedRoute requireIssuer>
            <Suspense fallback={<RouteLoadingFallback />}>
              <ManageCollectiblesPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
