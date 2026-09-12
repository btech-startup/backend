import { Router } from 'express';
import { CustomerController } from '../controllers/customerController.js';
import { validateBody } from '../middleware/validateMiddleware.js';

const router = Router();

router.post('/budget-split', validateBody(['totalBudget', 'guestCount']), CustomerController.calculateBudgetSplit);
router.get('/vendors', CustomerController.searchVendors);

export default router;
