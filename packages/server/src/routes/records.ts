import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import * as recordController from '../controllers/recordController';

const router = Router({ mergeParams: true });

router.get('/', authenticateJWT, verifyShopAccess, recordController.listRecords);

export default router;
