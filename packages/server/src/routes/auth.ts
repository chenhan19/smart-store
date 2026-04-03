import { Router, IRouter } from 'express';
import { login } from '../controllers/authController';

const router: IRouter = Router();

router.post('/login', login);

export default router;
