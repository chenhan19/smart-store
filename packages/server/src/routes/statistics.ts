import { Router, IRouter } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import { roleGuard } from '../middlewares/roleGuard';
import * as statisticsController from '../controllers/statisticsController';

const router: IRouter = Router({ mergeParams: true });

const ownerOnly = [authenticateJWT, verifyShopAccess, roleGuard(['owner'])];

router.get('/summary', ...ownerOnly, statisticsController.getSummary);
router.get('/trend', ...ownerOnly, statisticsController.getTrend);
router.get('/category-distribution', ...ownerOnly, statisticsController.getCategoryDistribution);
router.get('/top-inventory', ...ownerOnly, statisticsController.getTopInventory);

export default router;
