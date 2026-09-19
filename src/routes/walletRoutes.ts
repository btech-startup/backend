import { Router } from 'express';
import { WalletController } from '../controllers/walletController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', WalletController.getBalance);
router.post('/credit', WalletController.creditBalance);
router.post('/withdraw', WalletController.withdrawFunds);
router.get('/transactions', WalletController.getTransactions);

export default router;
