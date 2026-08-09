import { Router } from 'express';
import { getVocabulary } from '#controllers';

const router = Router();

router.get('/', getVocabulary);

export default router;
