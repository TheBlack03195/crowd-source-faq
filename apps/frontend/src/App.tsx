import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Navbar } from './components/ui/Navbar';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AccountPage } from './pages/AccountPage';
import { FAQPage } from './pages/FAQPage';
import { VoiceFaqPage } from './pages/VoiceFaqPage';
import { CommunityPage } from './pages/CommunityPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { GoldenTicketPage } from './pages/GoldenTicketPage';
import { SupportPage } from './pages/SupportPage';
import { SupportTicketPage } from './pages/SupportTicketPage';
import { FAQReviewQueuePage } from './pages/FAQReviewQueuePage';
import { AdminRoute } from './admin/components/AdminRoute';
import { AdminLayout } from './admin/components/AdminLayout';
import { AdminDashboard } from './admin/pages/AdminDashboard';
import { AdminFaqReview } from './admin/pages/AdminFaqReview';
import { AdminAutoAnswerQueue } from './admin/pages/AdminAutoAnswerQueue';
import { AdminCommunity } from './admin/pages/AdminCommunity';
import { AdminUsers } from './admin/pages/AdminUsers';
import { AdminZoom } from './admin/pages/AdminZoom';
import { AdminSettings } from './admin/pages/AdminSettings';
import { AdminSupport } from './admin/pages/AdminSupport';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/faq/voice" element={<VoiceFaqPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<PostDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/golden" element={<ProtectedRoute><GoldenTicketPage /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="/support/:id" element={<ProtectedRoute><SupportTicketPage /></ProtectedRoute>} />
          <Route path="/faq/review-queue" element={<ProtectedRoute><FAQReviewQueuePage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/faq-review"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminFaqReview />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/auto-answer"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminAutoAnswerQueue />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/community"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminCommunity />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/support"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminSupport />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/zoom"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminZoom />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
