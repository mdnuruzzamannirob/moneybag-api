import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  contributeSchema,
  createSavingsGoalSchema,
  idParamSchema,
  listSavingsGoalsSchema,
} from './validation.js';

const router = Router();

router.use(authenticate);
router.post('/', validate(createSavingsGoalSchema), controller.create);
router.get('/', validate(listSavingsGoalsSchema), controller.list);
router.patch(
  '/:id/contribute',
  validate(contributeSchema),
  controller.contribute,
);
router.delete('/:id', validate(idParamSchema), controller.remove);

export default router;
