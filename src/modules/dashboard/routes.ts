import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { dashboard } from './controller.js';
import { dashboardSchema } from './validation.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(dashboardSchema), dashboard);

export default router;
