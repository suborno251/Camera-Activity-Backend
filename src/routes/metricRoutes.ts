import { Router } from 'express';
import {
  getAllMetrics,
  getWorkers,
  getWorkstations,
  getFactory,
} from '../controllers/metricController';

const router = Router();

router.get('/',             getAllMetrics);
router.get('/workers',      getWorkers);
router.get('/workstations', getWorkstations);
router.get('/factory',      getFactory);

export default router;