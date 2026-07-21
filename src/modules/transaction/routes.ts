import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { AppError } from '../../utils/response.js';
import * as controller from './controller.js';
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsSchema,
  updateTransactionSchema,
} from './validation.js';

const router = Router();
const memory = multer.memoryStorage();
const csvUpload = multer({
  storage: memory,
  limits: { fileSize: 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      callback(new AppError(415, 'Only CSV files are allowed'));
      return;
    }
    callback(null, true);
  },
});
const receiptUpload = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new AppError(415, 'Only JPEG, PNG, and WebP receipts are allowed'));
      return;
    }
    callback(null, true);
  },
});

router.use(authenticate);
router.get('/', validate(listTransactionsSchema), controller.list);
router.post('/', validate(createTransactionSchema), controller.create);
router.post('/import', csvUpload.single('file'), controller.importCsv);
router.post(
  '/:id/receipt',
  validate(idParamSchema),
  receiptUpload.single('receipt'),
  controller.attachReceipt,
);
router.patch('/:id', validate(updateTransactionSchema), controller.update);
router.delete('/:id', validate(idParamSchema), controller.remove);

export default router;
