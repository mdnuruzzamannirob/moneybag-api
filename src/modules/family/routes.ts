import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  acceptInvitationSchema,
  createGroupSchema,
  groupTransactionsSchema,
  inviteMemberSchema,
  listGroupsSchema,
  removeMemberSchema,
} from './validation.js';

const router = Router();

router.use(authenticate);
router.get('/groups', validate(listGroupsSchema), controller.listGroups);
router.post('/groups', validate(createGroupSchema), controller.createGroup);
router.post(
  '/groups/:id/invite',
  validate(inviteMemberSchema),
  controller.inviteMember,
);
router.post(
  '/invitations/:token/accept',
  validate(acceptInvitationSchema),
  controller.acceptInvitation,
);
router.delete(
  '/groups/:id/members/:userId',
  validate(removeMemberSchema),
  controller.removeMember,
);
router.get(
  '/groups/:id/transactions',
  validate(groupTransactionsSchema),
  controller.listGroupTransactions,
);

export default router;
