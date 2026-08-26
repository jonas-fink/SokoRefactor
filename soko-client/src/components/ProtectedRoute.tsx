import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth, canCreate } from '../context/auth-context';

const ProtectedRoute = ({ requireCreator = false, requireAdmin = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-ink-mute text-sm">Loading...</p>
            </div>
        );
    }
    if (!user) {
        // Ziel merken, damit der Login dorthin zurueckspringt statt auf `/`.
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname + location.search }}
            />
        );
    }
    if (requireCreator && !canCreate(user)) {
        return <Navigate to="/settings" replace />;
    }
    // Beratungsangebote pflegt ausschliesslich `admin` (ARCHITEKTUR.md § 2.6).
    if (requireAdmin && user.role !== 'admin') {
        return <Navigate to="/settings" replace />;
    }
    return <Outlet />;
};

export default ProtectedRoute;
