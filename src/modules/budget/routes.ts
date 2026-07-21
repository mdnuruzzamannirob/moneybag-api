import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  createBudgetSchema,
  budgetIdSchema,
  listBudgetSchema,
  updateBudgetSchema,
} from './validation.js';

const router = Router();

router.use(authenticate);
router.post('/', validate(createBudgetSchema), controller.create);
router.get('/', validate(listBudgetSchema), controller.list);
router.get('/alerts', controller.alerts);
router.patch('/:id', validate(updateBudgetSchema), controller.update);
router.delete('/:id', validate(budgetIdSchema), controller.remove);

export default router;
