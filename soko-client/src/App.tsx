import { Suspense } from 'react';
import { Routes, Route } from 'react-router';
import AppLayout from './layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Beratung from './pages/Beratung';
import Map from './pages/Map';
import Library from './pages/Library';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import LayoutSkeleton from './components/skeletons/LayoutSkeleton';

const App = () => {
    return (
        <Suspense fallback={<LayoutSkeleton />}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<AppLayout />}>
                    <Route index element={<LandingPage />} />

                    <Route path="/beratung" element={<Beratung />} />
                    <Route path="/karte" element={<Map />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/library" element={<Library />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
};

export default App;
