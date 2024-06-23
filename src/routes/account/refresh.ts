import {Response, Router} from 'express';
import Session from '../../utils/user/Session';
import {auth, AuthRequest} from '../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../types/ErrorResponse';

const router = Router();

interface RsBody {
	access_token: string;
	user_id: number;
}

/*
This is used to refresh the access token with the refresh token
 */
router.post('/', auth('refresh'),
	async (req: AuthRequest<{}, RsBody | ErrorResponse>, res: Response<RsBody | ErrorResponse>) => {
		const userData = req.user;
		if (!userData) {
			res.status(500).json({
				message: 'Internal server error',
				type: 'internal_error',
				longMessage: 'User data not found',
			});
			return;
		}
		const session = await Session.byId(userData.session_id);
		if (!session) {
			res.status(500).json({
				message: 'Internal server error',
				type: 'internal_error',
				longMessage: 'Session not found',
			});
			return;
		}
		res.json({
			access_token: session.accessToken,
			user_id: session.userId,
		});
	},
);

export default router;
