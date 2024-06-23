import {Router} from 'express';
import register from './register';
import login from './login';
import refresh from './refresh';

const router = Router();

router.use('/register', register);
router.use('/login', login);
router.use('/refresh', refresh);

export default router;
