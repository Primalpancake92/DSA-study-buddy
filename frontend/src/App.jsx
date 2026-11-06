import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider.jsx';
import { AppLayout, AuthLayout, PublicLayout } from './components/AppShell.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { CheckYourEmailPage, ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages.jsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { CurriculumPreviewPage } from './pages/CurriculumPreviewPage.jsx';
import { LessonPage } from './pages/LessonPage.jsx';
import { RoadmapPage } from './pages/RoadmapPage.jsx';
import { ModulesPage } from './pages/ModulesPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import './styles/app.css';
import './styles/reading.css';

function GuestOnly() { const { user, loading } = useAuth(); if (loading) return <div className="auth-loading">Loading…</div>; return user ? <Navigate to="/app/dashboard" replace /> : <Outlet />; }

export default function App() { return <AuthProvider><BrowserRouter><Routes><Route element={<PublicLayout />}><Route path="/" element={<LandingPage />} /><Route path="/curriculum" element={<CurriculumPreviewPage />} /></Route><Route element={<AuthLayout />}><Route element={<GuestOnly />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/check-your-email" element={<CheckYourEmailPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /></Route></Route><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/app" element={<Navigate to="/app/dashboard" replace />} /><Route path="/app/dashboard" element={<DashboardPage />} /><Route path="/app/roadmap" element={<RoadmapPage />} /><Route path="/app/modules" element={<ModulesPage />} /><Route path="/app/weeks/:weekId" element={<LessonPage />} /><Route path="/app/settings" element={<SettingsPage />} /><Route path="/roadmap" element={<Navigate to="/app/roadmap" replace />} /><Route path="/lesson/:weekId" element={<Navigate to="/app/weeks/:weekId" replace />} /><Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} /></Route></Route></Routes></BrowserRouter></AuthProvider>; }
