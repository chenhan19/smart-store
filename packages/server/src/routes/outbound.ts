import { Router, IRouter } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import * as outboundController from '../controllers/outboundController';

const router: IRouter = Router({ mergeParams: true });

router.post('/', authenticateJWT, verifyShopAccess, outboundController.createOutbound);

export default router;
