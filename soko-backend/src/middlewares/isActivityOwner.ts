import { type RequestHandler } from 'express';
import { Activity } from '#models';

const isActivityOwner: RequestHandler = async (req, res, next) => {
    try {
        const authUserId = req.userId;
        const authUserRole = req.role;
        const { id } = req.params;

        const activity = await Activity.findById(id);

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Check: Is the authenticated user the creator? OR are they an admin?
        const isOwner = activity.userId.toString() === authUserId;
        const isAdmin = authUserRole === 'admin';

        if (isOwner || isAdmin) {
            return next();
        }

        return res.status(403).json({
            error: 'Unauthorized: You do not own this activity.',
        });
    } catch (error) {
        next(error);
    }
};

export default isActivityOwner;
