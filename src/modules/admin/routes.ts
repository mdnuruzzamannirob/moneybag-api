import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  assignPlanSchema,
  cancelSubscriptionSchema,
  createGlobalCategorySchema,
  createPlanSchema,
  idParamSchema,
  listAuditLogsSchema,
  listEmailTemplatesSchema,
  listGlobalCategoriesSchema,
  listPlansSchema,
  listSubscriptionsSchema,
  listUsersSchema,
  refundSubscriptionSchema,
  updateEmailTemplateSchema,
  updateGlobalCategorySchema,
  updatePlanSchema,
  updateSettingsSchema,
  userStatusSchema,
} from './validation.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', controller.stats);

router.get('/users', validate(listUsersSchema), controller.users);
router.get('/users/:id', validate(idParamSchema), controller.userDetail);
router.patch(
  '/users/:id/status',
  validate(userStatusSchema),
  controller.updateStatus,
);
router.post(
  '/users/:id/impersonate',
  validate(idParamSchema),
  controller.impersonate,
);
router.patch(
  '/users/:id/plan',
  validate(assignPlanSchema),
  controller.assignPlan,
);

router.get(
  '/subscriptions',
  validate(listSubscriptionsSchema),
  controller.subscriptions,
);
router.post(
  '/subscriptions/:id/refund',
  validate(refundSubscriptionSchema),
  controller.refundSubscription,
);
router.post(
  '/subscriptions/:id/cancel',
  validate(cancelSubscriptionSchema),
  controller.cancelSubscription,
);
router.post(
  '/subscriptions/:id/reactivate',
  validate(idParamSchema),
  controller.reactivateSubscription,
);

router.get('/plans', validate(listPlansSchema), controller.plans);
router.post('/plans', validate(createPlanSchema), controller.createPlan);
router.patch('/plans/:id', validate(updatePlanSchema), controller.updatePlan);
router.delete('/plans/:id', validate(idParamSchema), controller.archivePlan);

router.get(
  '/categories',
  validate(listGlobalCategoriesSchema),
  controller.globalCategories,
);
router.post(
  '/categories',
  validate(createGlobalCategorySchema),
  controller.createGlobalCategory,
);
router.patch(
  '/categories/:id',
  validate(updateGlobalCategorySchema),
  controller.updateGlobalCategory,
);
router.delete(
  '/categories/:id',
  validate(idParamSchema),
  controller.deleteGlobalCategory,
);

router.get('/logs', validate(listAuditLogsSchema), controller.auditLogs);

router.get(
  '/email-templates',
  validate(listEmailTemplatesSchema),
  controller.emailTemplates,
);
router.patch(
  '/email-templates/:id',
  validate(updateEmailTemplateSchema),
  controller.updateEmailTemplate,
);

router.get('/settings', controller.settings);
router.patch(
  '/settings',
  validate(updateSettingsSchema),
  controller.updateSettings,
);

export default router;
