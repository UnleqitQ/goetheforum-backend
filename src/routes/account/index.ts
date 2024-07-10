import {Router} from 'express';
import register from './register';
import login from './login';
import refresh from './refresh';
import settings from './settings';
import info from './info';
import logout from './logout';

const router = Router();

router.use('/register', register);
router.use('/login', login);
router.use('/refresh', refresh);
router.use('/settings', settings);
router.use('/info', info);
router.use('/logout', logout);

export default router;
