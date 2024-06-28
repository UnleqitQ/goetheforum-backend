import {Request, Response, Router} from 'express';
import info from './info';

const router = Router();

router.use('/:user_id/info', info);

export default router;
