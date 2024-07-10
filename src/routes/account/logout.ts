import {Response, Router} from 'express';
import {AuthRequest, auth} from '../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../types/ErrorResponse';
import Session from '../../utils/user/Session';

const router = Router();

router.post('/', auth(), async (req: AuthRequest, res: Response<null | ErrorResponse>) => {
	if (!req.user) {
		return res.status(500).json({
			type: 'internal_server_error',
			message: 'User not found',
		});
	}
	
	const session = await Session.byId(req.user.session_id);
	if (!session) {
		return res.status(404).json({
			type: 'not_found',
			message: 'Session not found',
		});
	}
	
	await session.delete();
	
	return res.send();
});

export default router;
