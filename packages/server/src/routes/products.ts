import { Router, IRouter } from 'express';
import { authenticateJWT } from '../middlewares/authenticateJWT';
import { verifyShopAccess } from '../middlewares/verifyShopAccess';
import * as productController from '../controllers/productController';

const router: IRouter = Router({ mergeParams: true });

router.get('/', authenticateJWT, verifyShopAccess, productController.listProducts);
router.post('/', authenticateJWT, verifyShopAccess, productController.createProduct);
// by-code must be registered before /:productId to avoid route conflict
router.get('/by-code/:code', authenticateJWT, verifyShopAccess, productController.getProductByCode);
router.get('/:productId', authenticateJWT, verifyShopAccess, productController.getProduct);
router.put('/:productId', authenticateJWT, verifyShopAccess, productController.updateProduct);

export default router;
