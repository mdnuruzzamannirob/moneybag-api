import { Router, raw } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import { checkoutSchema } from './validation.js';

export const billingWebhookRoutes = Router();
billingWebhookRoutes.post(
  '/',
  raw({ type: 'application/json', limit: '1mb' }),
  controller.webhook,
);

const router = Router();
router.use(authenticate);
router.get('/plans', controller.plans);
router.get('/subscription', controller.subscription);
router.post('/checkout', validate(checkoutSchema), controller.checkout);
router.post('/portal', controller.portal);

export default router;
