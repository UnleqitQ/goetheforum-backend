import {Router} from 'express';
import register from './register';
import login from './login';
import refresh from './refresh';
import settings from './settings';

const router = Router();

router.use('/register', register);
router.use('/login', login);
router.use('/refresh', refresh);
router.use('/settings', settings);

export default router;
