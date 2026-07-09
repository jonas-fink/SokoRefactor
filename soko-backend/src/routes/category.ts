import { Router } from 'express';
import { getCategories } from '#controllers';

const router = Router();

router.get('/', getCategories);

export default router;
