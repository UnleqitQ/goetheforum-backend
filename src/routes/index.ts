import {Router} from 'express';
import account from './account';
import swagger from './swagger';

const router = Router();

// Add sub-routes
router.use('/account', account);
router.use('/', swagger);

export default router;
