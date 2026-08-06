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
import Profile from './pages/Profile';
import BeratungKategorie from './pages/BeratungKategorie';
import BeratungDetail from './pages/BeratungDetail';
import Erstellen from './pages/Erstellen';
import AngebotDetail from './pages/AngebotDetail';

const App = () => {
    return (
        <Suspense fallback={<LayoutSkeleton />}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/" element={<AppLayout />}>
                    <Route index element={<LandingPage />} />
                    <Route
                        path="angebot/:itemType/:id"
                        element={<AngebotDetail />}
                    />

                    <Route path="beratung">
                        <Route index element={<Beratung />} />
                        <Route path="detail/:id" element={<BeratungDetail />} />
                        <Route path=":key" element={<BeratungKategorie />} />
                    </Route>

                    <Route path="/erleben" element={<Map />} />
                    <Route element={<ProtectedRoute />}>
                        <Route path="/library" element={<Library />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>
                    <Route element={<ProtectedRoute requireCreator />}>
                        <Route path="/erstellen" element={<Erstellen />} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
};

export default App;
