import {Router} from 'express';
import register from './register';
import login from './login';
import refresh from './refresh';
import change_password from './change_password';

const router = Router();

router.use('/register', register);
router.use('/login', login);
router.use('/refresh', refresh);
router.use('/change_password', change_password);

export default router;
