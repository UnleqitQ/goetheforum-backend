import {Router} from 'express';
import account from './account';
import swagger from './swagger';
import user from './user';

const router = Router();

// Add sub-routes
router.use('/account', account);
router.use('/user', user);
router.use('/', swagger);

export default router;
