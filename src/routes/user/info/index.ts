import {Request, Response, Router} from 'express';
import UserInfo from '../../../utils/user/UserInfo';
import {UserInfoData} from '../../../types/user/UserInfoData';
import {AuthRequest, auth} from '../../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../../types/ErrorResponse';
import User from '../../../utils/user/User';
import {Role} from '../../../types/Role';
import {validationResult, param, matchedData} from 'express-validator';

// Param for all routes: ':user_id'
const router = Router({mergeParams: true});

// GET /user/:user_id/info
{
	type RsBody = UserInfoData;
	
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
	];
	
	router.get('/', validate, auth(),
		async (req: AuthRequest, res: Response<RsBody | ErrorResponse>) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: errors.array(),
				});
				return;
			}
			
			// check if user is logged in and is verified
			{
				if (!req.user) {
					return res.status(500).json({
						type: 'internal_server_error',
						message: 'User not found',
					});
				}
				
				const currentUser = await User.byId(req.user.id);
				if (!currentUser) {
					return res.status(500).json({
						type: 'internal_server_error',
						message: 'User not found',
					});
				}
				
				if (currentUser.role === Role.UNVERIFIED) {
					return res.status(403).json({
						type: 'forbidden',
						message: 'User is unverified',
					});
				}
			}
			
			const data = matchedData(req, {locations: ['params']}) as {user_id: number};
			const user = await User.byId(data.user_id);
			if (!user) {
				return res.status(404).json({
					type: 'not_found',
					message: 'User not found',
				});
			}
			const userInfo = await UserInfo.byUserId(data.user_id);
			if (!userInfo) {
				return res.status(404).json({
					type: 'not_found',
					message: 'User not found',
				});
			}
			
			res.json(userInfo.data);
		});
	
	
}

export default router;
