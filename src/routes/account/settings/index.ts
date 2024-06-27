import {Router} from 'express';
import change_password from './change_password';
import totp from './totp';

const router = Router();

router.use('/change_password', change_password);
router.use('/totp', totp);

export default router;
