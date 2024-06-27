import {Router} from 'express';
import change_password from './change_password';

const router = Router();

router.use('/change_password', change_password);

export default router;
