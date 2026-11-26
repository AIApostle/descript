import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthGuard } from './components/auth/AuthGuard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AgentProvider } from './context/AgentContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import AgentProfilePage from './pages/AgentProfilePage';
import DashboardPage from './pages/DashboardPage';
import DevelopersPage from './pages/DevelopersPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicAgentPage from './pages/PublicAgentPage';
import RegisterAgentPage from './pages/RegisterAgentPage';
import SettingsPage from './pages/SettingsPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <AgentProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/verify" element={<PublicAgentPage />} />
                  <Route path="/agent/:id" element={<PublicAgentPage />} />
                  <Route path="/docs" element={<DevelopersPage />} />
                  <Route path="/developers" element={<DevelopersPage />} />

                  {/* Protected Controller Platform Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <AuthGuard>
                        <DashboardPage />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/agents"
                    element={
                      <AuthGuard>
                        <DashboardPage />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/agents/new"
                    element={
                      <AuthGuard>
                        <RegisterAgentPage />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/dashboard/agents/new"
                    element={
                      <AuthGuard>
                        <RegisterAgentPage />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/agents/:id"
                    element={
                      <AuthGuard>
                        <AgentProfilePage />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <AuthGuard>
                        <SettingsPage />
                      </AuthGuard>
                    }
                  />

                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Router>
            </AgentProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
