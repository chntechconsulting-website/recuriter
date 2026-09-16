import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RecruiterLeads } from './pages/RecruiterLeads';
import { AddRecruiterLead } from './pages/AddRecruiterLead';
import { EditRecruiterLead } from './pages/EditRecruiterLead';
import { RecruiterDetails } from './pages/RecruiterDetails';
import { Candidates } from './pages/Candidates';
import { AddCandidate } from './pages/AddCandidate';
import { EditCandidate } from './pages/EditCandidate';
import { CandidateDetails } from './pages/CandidateDetails';
import { FollowUps } from './pages/FollowUps';
import { ImportLeads } from './pages/ImportLeads';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { ActivityLogs } from './pages/ActivityLogs';
import { Settings } from './pages/Settings';
import { RecruiterActivityList } from './pages/RecruiterActivityList';
import { RecruiterActivityDetails } from './pages/RecruiterActivityDetails';
import { AssignColleges } from './pages/AssignColleges';
import { AssignVendors } from './pages/AssignVendors';
import { AssignCandidates } from './pages/AssignCandidates';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <LoadingSpinner text="Checking authorization..." size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="admin/recruiters-activity"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <RecruiterActivityList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/recruiters-activity/:id"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <RecruiterActivityDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/assign-candidates"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AssignCandidates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/assign-colleges"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AssignColleges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/assign-vendors"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AssignVendors />
                  </ProtectedRoute>
                }
              />
              <Route path="recruiters" element={<RecruiterLeads />} />
              <Route path="recruiters/new" element={<AddRecruiterLead />} />
              <Route path="recruiters/:id" element={<RecruiterDetails />} />
              <Route path="recruiters/:id/edit" element={<EditRecruiterLead />} />
              <Route path="candidates" element={<Candidates />} />
              <Route path="candidates/new" element={<AddCandidate />} />
              <Route path="candidates/:id" element={<CandidateDetails />} />
              <Route path="candidates/:id/edit" element={<EditCandidate />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="import" element={<ImportLeads />} />
              <Route path="reports" element={<Reports />} />
              <Route
                path="users"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="activity-logs"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <ActivityLogs />
                  </ProtectedRoute>
                }
              />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
