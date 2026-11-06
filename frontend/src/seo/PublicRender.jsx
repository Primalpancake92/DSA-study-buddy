import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../components/AuthProvider.jsx';
import { PublicLayout } from '../components/AppShell.jsx';
import { LandingPage } from '../pages/LandingPage.jsx';
import { CurriculumPreviewPage } from '../pages/CurriculumPreviewPage.jsx';

export function PublicRender({ pathname }) {
  return <AuthProvider><MemoryRouter initialEntries={[pathname]}><Routes><Route element={<PublicLayout />}><Route path="/" element={<LandingPage />} /><Route path="/curriculum" element={<CurriculumPreviewPage />} /></Route></Routes></MemoryRouter></AuthProvider>;
}
