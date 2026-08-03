import type { RequestHandler } from 'express';
import type { UserRole } from '#models';

const requireRole =
    (...roles: UserRole[]): RequestHandler =>
    (req, res, next) => {
        if (!req.role || !roles.includes(req.role)) {
            res.status(403).json({
                message: `Requires role: ${roles.join(' or ')}`,
            });
            return;
        }
        next();
    };

export default requireRole;

export const adminOnly = requireRole('admin');
export const canCreate = requireRole('admin', 'creator');
