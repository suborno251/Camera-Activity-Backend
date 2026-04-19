import { Router } from 'express';
import { ingestEvent, ingestBatch } from '../controllers/eventController';

const router = Router();

router.post('/',       ingestEvent);
router.post('/batch',  ingestBatch);

export default router;