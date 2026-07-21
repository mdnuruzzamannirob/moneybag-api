import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  emptyMutationSchema,
  listNotificationsSchema,
  notificationIdSchema,
} from './validation.js';

const router = Router();

router.use(authenticate);
router.get('/', validate(listNotificationsSchema), controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch(
  '/read-all',
  validate(emptyMutationSchema),
  controller.markAllRead,
);
router.patch('/:id/read', validate(notificationIdSchema), controller.markRead);

export default router;
