import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Seo } from './seo/Seo.jsx';
import { AuthProvider, useAuth } from './components/AuthProvider.jsx';
import { AppLayout, AuthLayout, PublicLayout } from './components/AppShell.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AccountSettingsProvider } from './components/AccountSettingsProvider.jsx';
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })));
import { CheckYourEmailPage, ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from './pages/AuthPages.jsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { CurriculumPreviewPage } from './pages/CurriculumPreviewPage.jsx';
const LessonPage = lazy(() => import('./pages/LessonPage.jsx').then((module) => ({ default: module.LessonPage })));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage.jsx').then((module) => ({ default: module.RoadmapPage })));
const ModulesPage = lazy(() => import('./pages/ModulesPage.jsx').then((module) => ({ default: module.ModulesPage })));
const AccountSettingsLayout = lazy(() => import('./pages/account/AccountSettingsLayout.jsx').then((module) => ({ default: module.AccountSettingsLayout })));
const ProfileSettings = lazy(() => import('./pages/account/ProfileSettings.jsx').then((module) => ({ default: module.ProfileSettings })));
const SecuritySettings = lazy(() => import('./pages/account/SecuritySettings.jsx').then((module) => ({ default: module.SecuritySettings })));
const ConnectedAccountsSettings = lazy(() => import('./pages/account/ConnectedAccountsSettings.jsx').then((module) => ({ default: module.ConnectedAccountsSettings })));
const LearningPreferencesSettings = lazy(() => import('./pages/account/PreferencesSettings.jsx').then((module) => ({ default: module.LearningPreferencesSettings })));
const NotificationSettings = lazy(() => import('./pages/account/PreferencesSettings.jsx').then((module) => ({ default: module.NotificationSettings })));
const AccessibilitySettings = lazy(() => import('./pages/account/PreferencesSettings.jsx').then((module) => ({ default: module.AccessibilitySettings })));
const AppearanceSettings = lazy(() => import('./pages/account/PreferencesSettings.jsx').then((module) => ({ default: module.AppearanceSettings })));
const DataPrivacySettings = lazy(() => import('./pages/account/DataPrivacySettings.jsx').then((module) => ({ default: module.DataPrivacySettings })));
import './styles/app.css';
import './styles/reading.css';
import './styles/tokens.css';
import './styles/theme.css';
import './styles/preferences.css';

function GuestOnly() { const { user, loading } = useAuth(); if (loading) return <div className="auth-loading">Loading…</div>; return user ? <Navigate to="/app/dashboard" replace /> : <Outlet />; }

export default function App() { return <AuthProvider><AccountSettingsProvider><BrowserRouter><Seo /><Suspense fallback={<div className="auth-loading" role="status">Loading page…</div>}><Routes><Route element={<PublicLayout />}><Route path="/" element={<LandingPage />} /><Route path="/curriculum" element={<CurriculumPreviewPage />} /></Route><Route element={<AuthLayout />}><Route element={<GuestOnly />}><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/check-your-email" element={<CheckYourEmailPage />} /><Route path="/verify-email" element={<VerifyEmailPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /></Route></Route><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/app" element={<Navigate to="/app/dashboard" replace />} /><Route path="/app/dashboard" element={<DashboardPage />} /><Route path="/app/roadmap" element={<RoadmapPage />} /><Route path="/app/modules" element={<ModulesPage />} /><Route path="/app/weeks/:weekId" element={<LessonPage />} /><Route path="/app/settings" element={<AccountSettingsLayout />}><Route index element={<Navigate to="profile" replace />} /><Route path="profile" element={<ProfileSettings />} /><Route path="security" element={<SecuritySettings />} /><Route path="connections" element={<ConnectedAccountsSettings />} /><Route path="learning" element={<LearningPreferencesSettings />} /><Route path="notifications" element={<NotificationSettings />} /><Route path="accessibility" element={<AccessibilitySettings />} /><Route path="appearance" element={<AppearanceSettings />} /><Route path="privacy" element={<DataPrivacySettings />} /></Route><Route path="/roadmap" element={<Navigate to="/app/roadmap" replace />} /><Route path="/lesson/:weekId" element={<Navigate to="/app/weeks/:weekId" replace />} /><Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} /></Route></Route></Routes></Suspense></BrowserRouter></AccountSettingsProvider></AuthProvider>; }
