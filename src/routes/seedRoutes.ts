import { Router } from 'express';
import { refreshSeed, seedStatus } from '../controllers/seedController';

const router = Router();

router.post('/refresh', refreshSeed);
router.get('/status',   seedStatus);

export default router;