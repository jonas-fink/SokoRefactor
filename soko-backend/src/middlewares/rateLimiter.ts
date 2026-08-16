import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        message: ' Zu viele Versuche - bitte in 15 Minuten erneut versuchen',
    },
});

// /refresh is hit on every app boot + token cycle → lenient, but still capped
// to blunt refresh-token brute force / rotation abuse.
export const refreshRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen - bitte kurz warten' },
});

// Blanket per-IP safety net for the whole API.
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen - bitte kurz warten' },
});

// Schreibt in die Datenbank, ohne Login erreichbar — also spamanfaellig. 5 pro
// Viertelstunde reichen fuer echtes Feedback und machen ein Zumuellen laestig.
export const feedbackRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen - bitte kurz warten' },
});

// Strenger als das globale Limit: hinter dem Chat stehen Kosten pro Call
// (GenAI), und ein Need-Finding-Dialog braucht keine 300 Requests. 40 statt 20,
// seit Rückfragen möglich sind: ein Gespräch kostet mehrere Calls, und hinter
// einer IP kann ein geteiltes WLAN stehen.
export const chatRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Zu viele Anfragen - bitte kurz warten' },
});

// Strenger als der Chat selbst: eine Transkription schickt Audio an das Modell
// und kostet ein Vielfaches eines Textcalls. 20 Aufnahmen pro Viertelstunde
// decken ein Gespraech ab, in dem jede Nachricht gesprochen wird.
export const transcribeRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Zu viele Aufnahmen - bitte kurz warten' },
});
