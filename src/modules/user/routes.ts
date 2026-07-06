import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import { changePasswordSchema, updateProfileSchema } from './validation.js';

const router = Router();

router.use(authenticate);
router.get('/me', controller.me);
router.patch('/me', validate(updateProfileSchema), controller.updateMe);
router.patch(
  '/me/password',
  validate(changePasswordSchema),
  controller.changePassword,
);

export default router;
