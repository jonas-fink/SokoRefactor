import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '#models';

/**
 * Wie `protect`, nur ohne Zwang: liegt ein gültiges Token an, stehen `req.userId`
 * und `req.role`; sonst geht es als Gast weiter. Kein 401.
 *
 * Nur für Routen, deren anonymer Pfad ein **vollwertiges** Ergebnis liefert —
 * beim Chat also alles außer dem gespeicherten Verlauf. Ein abgelaufenes Token
 * darf den Chat nicht blockieren, sondern kostet nur die Persistenz.
 */
const optionalAuth: RequestHandler = (req, _res, next) => {
    const token = req.headers.authorization?.startsWith('Bearer')
        ? req.headers.authorization.split(' ')[1]
        : undefined;

    if (token) {
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_ACCESS_SECRET as string,
            ) as { userId: string; role?: UserRole };

            req.userId = decoded.userId;
            req.role = decoded.role ?? 'user';
        } catch {
            // Abgelaufen oder manipuliert: Gastpfad, kein Fehler.
        }
    }

    next();
};

export default optionalAuth;
