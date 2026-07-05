import { type RequestHandler } from 'express';

const isOwnerOrAdmin: RequestHandler = async (req, res, next) => {
    const authUserId = (req as any).user;
    const authUserRole = (req as any).role;
    const targetUserId = req.params.id;

    const isOwner = authUserId === targetUserId;
    const isAdmin = authUserRole === 'admin';

    if (isOwner || isAdmin) {
        return next();
    }

    return res.status(403).json({
        error: 'Access denied. You can only modify your own profile.',
    });
};

export default isOwnerOrAdmin;
