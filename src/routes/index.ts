import {Router} from 'express';
import account from './account';

const router = Router();

// Add sub-routes
router.use('/account', account);

export default router;
