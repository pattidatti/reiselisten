import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RequireAuth } from './components/layout/RequireAuth';
import { Header } from './components/layout/Header';
import { UsernameSetupModal } from './components/profile/UsernameSetupModal';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { PublicListView } from './pages/PublicListView';
import { ListEditView } from './pages/ListEditView';
import { ProfilePage } from './pages/ProfilePage';
import { EditProfilePage } from './pages/EditProfilePage';
import { SearchPage } from './pages/SearchPage';
import { SharedLinkRedirect } from './pages/SharedLinkRedirect';
import { Backpack } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Header />
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Backpack className="w-12 h-12 text-stone-300" />
          <div className="h-2 w-24 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/logg-inn" element={<LoginPage />} />
          <Route path="/bruker/:username" element={<ProfilePage />} />
          <Route path="/liste/:listId" element={<PublicListView />} />
          <Route path="/sok" element={<SearchPage />} />
          <Route path="/delt/:token" element={<SharedLinkRedirect />} />

          {/* Authenticated routes */}
          <Route path="/dashbord" element={
            <RequireAuth>
              <AuthenticatedLayout>
                <Dashboard />
              </AuthenticatedLayout>
            </RequireAuth>
          } />
          <Route path="/profil/rediger" element={
            <RequireAuth>
              <AuthenticatedLayout>
                <EditProfilePage />
              </AuthenticatedLayout>
            </RequireAuth>
          } />
          <Route path="/liste/:listId/rediger" element={
            <RequireAuth>
              <AuthenticatedLayout>
                <ListEditView />
              </AuthenticatedLayout>
            </RequireAuth>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Username setup modal - shows globally when needed */}
        <UsernameSetupModal />
      </div>
    </ErrorBoundary>
  );
}
