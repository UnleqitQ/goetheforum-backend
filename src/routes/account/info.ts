import {Response, Router} from 'express';
import Account from '../../utils/user/Account';
import User from '../../utils/user/User';
import {AuthRequest, auth} from '../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../types/ErrorResponse';
import {UserData} from '../../types/user/UserData';
import {SessionData} from '../../types/user/SessionData';
import Session from '../../utils/user/Session';

const router = Router();

interface RsBody {
	user: UserData;
	session: SessionData;
}

router.get('/', auth(), async (req: AuthRequest, res: Response<RsBody | ErrorResponse>) => {
	if (!req.user) {
		return res.status(500).json({
			type: 'internal_server_error',
			message: 'User not found',
		});
	}
	
	const user = await User.byId(req.user.id);
	const session = await Session.byId(req.user.session_id);
	if (!user) {
		return res.status(404).json({
			type: 'not_found',
			message: 'User not found',
		});
	}
	if (!session) {
		return res.status(404).json({
			type: 'not_found',
			message: 'Session not found',
		});
	}
	
	return res.json({
		user: user.data,
		session: session.data,
	});
});

export default router;
