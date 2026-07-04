import { Routes, Route } from 'react-router';
import AppLayout from './layout/AppLayout';
import LandingPage from './pages/LandingPage';
import Beratung from './pages/Beratung';
import Map from './pages/Map';
import Library from './pages/Library';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="/beratung" element={<Beratung />} />
                <Route path="/karte" element={<Map />} />
                <Route path="/library" element={<Library />} />
            </Route>
        </Routes>
    );
};

export default App;
