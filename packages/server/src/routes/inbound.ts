import { Router, IRouter } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import * as inboundController from '../controllers/inboundController';

const router: IRouter = Router({ mergeParams: true });

router.post('/', authenticateJWT, verifyShopAccess, inboundController.createInbound);

export default router;
