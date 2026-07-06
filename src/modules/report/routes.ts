import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  exportSchema,
  monthlySchema,
  trendSchema,
  yearlySchema,
} from './validation.js';

const router = Router();

router.use(authenticate);
router.get('/monthly', validate(monthlySchema), controller.monthly);
router.get('/yearly', validate(yearlySchema), controller.yearly);
router.get(
  '/category-breakdown',
  validate(monthlySchema),
  controller.categoryBreakdown,
);
router.get('/trend', validate(trendSchema), controller.trend);
router.get('/export', validate(exportSchema), controller.exportReport);

export default router;
