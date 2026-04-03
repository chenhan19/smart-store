import { Router, IRouter } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import * as inventoryController from '../controllers/inventoryController';

const router: IRouter = Router({ mergeParams: true });

router.get('/', authenticateJWT, verifyShopAccess, inventoryController.listInventory);
router.put('/:productId/threshold', authenticateJWT, verifyShopAccess, inventoryController.setAlertThreshold);

export default router;
