import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.tsx';
import AuthProvider from './context/AuthContext.tsx';

// Umami-Tracker, wenn beim Build konfiguriert. Cookielos und ohne
// Geraetespeicher, deshalb ohne Consent-Banner (TDDDG § 25) — siehe
// `pages/Datenschutz.tsx`.
//
// ponytail: hier statt als Tag in `index.html`. Vite laesst ein nicht gesetztes
// `%VITE_UMAMI_SRC%` woertlich stehen; das waere in jedem Deployment ohne
// Umami — und in jedem `npm run dev` — ein 404 auf jeder Seite.
const umamiSrc = import.meta.env.VITE_UMAMI_SRC;
if (umamiSrc) {
    const tracker = document.createElement('script');
    tracker.defer = true;
    tracker.src = umamiSrc;
    tracker.dataset.websiteId = import.meta.env.VITE_UMAMI_ID;
    document.head.append(tracker);
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
);
