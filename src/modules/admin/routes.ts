import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import { listUsersSchema, userStatusSchema } from './validation.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/users', validate(listUsersSchema), controller.users);
router.patch(
  '/users/:id/status',
  validate(userStatusSchema),
  controller.updateStatus,
);
router.get('/stats', controller.stats);

export default router;
