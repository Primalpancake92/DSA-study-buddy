import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';

export function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading)
        return (
            <div className="auth-loading" role="status">
                Loading your learning space…
            </div>
        );
    return user ? (
        <Outlet />
    ) : (
        <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
    );
}
