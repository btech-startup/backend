import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { validateBody } from '../middleware/validateMiddleware';

const router = Router();

router.post('/budget-split', validateBody(['totalBudget', 'guestCount']), CustomerController.calculateBudgetSplit);
router.get('/vendors', CustomerController.searchVendors);

export default router;
