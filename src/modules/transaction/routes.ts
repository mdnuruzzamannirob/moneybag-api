import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import * as controller from './controller.js';
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsSchema,
  updateTransactionSchema,
} from './validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype !== 'text/csv' &&
      file.mimetype !== 'application/vnd.ms-excel'
    ) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }

    cb(null, true);
  },
});

router.use(authenticate);
router.get('/', validate(listTransactionsSchema), controller.list);
router.post('/', validate(createTransactionSchema), controller.create);
router.post('/import', upload.single('file'), controller.importCsv);
router.patch('/:id', validate(updateTransactionSchema), controller.update);
router.delete('/:id', validate(idParamSchema), controller.remove);

export default router;
