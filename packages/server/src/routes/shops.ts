import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import * as shopController from '../controllers/shopController';
import productsRouter from './products';
import inventoryRouter from './inventory';
import inboundRouter from './inbound';
import outboundRouter from './outbound';
import recordsRouter from './records';
import statisticsRouter from './statistics';

const router = Router();

router.get('/', authenticateJWT, shopController.getShops);
router.post('/', authenticateJWT, shopController.createShop);
router.get('/:shopId', authenticateJWT, verifyShopAccess, shopController.getShop);
router.put('/:shopId', authenticateJWT, verifyShopAccess, shopController.updateShop);
router.get('/:shopId/members', authenticateJWT, verifyShopAccess, shopController.getMembers);
router.post('/:shopId/members', authenticateJWT, verifyShopAccess, shopController.addMember);
router.delete('/:shopId/members/:userId', authenticateJWT, verifyShopAccess, shopController.removeMember);

router.use('/:shopId/products', productsRouter);
router.use('/:shopId/inventory', inventoryRouter);
router.use('/:shopId/inbound', inboundRouter);
router.use('/:shopId/outbound', outboundRouter);
router.use('/:shopId/records', recordsRouter);
router.use('/:shopId/statistics', statisticsRouter);

export default router;
