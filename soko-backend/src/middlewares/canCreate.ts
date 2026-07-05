import type { RequestHandler } from 'express';

const canCreate: RequestHandler = (req, res, next) => {
    if (req.role !== 'admin' && req.role !== 'creator') {
        res.status(403).json({ message: 'Admin or Creator access required' });
        return;
    }
    next();
};

export default canCreate;
