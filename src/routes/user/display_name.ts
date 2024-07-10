import {Request, Response, Router} from 'express';
import {AuthRequest, auth} from '../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../types/ErrorResponse';
import {validationResult, param, body, matchedData} from 'express-validator';
import User from '../../utils/user/User';
import {Role, RoleLevel} from '../../types/Role';
import {UserData} from '../../types/user/UserData';

const router = Router({mergeParams: true});

// GET /user/:user_id/display_name
{
	interface RsBody {
		value: string;
	}
	
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
	];
	
	router.get('/', validate,
		async (req: Request, res: Response<RsBody | ErrorResponse>) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: errors.array(),
				});
				return;
			}
			
			const data = matchedData(req, {locations: ['params']}) as { user_id: number };
			const user = await User.byId(data.user_id);
			if (!user) {
				return res.status(404).json({
					type: 'not_found',
					message: 'User not found',
				});
			}
			
			res.json({value: user.data.displayName});
		});
}

// PUT /user/:user_id/display_name
{
	interface RqBody {
		value: string;
	}
	
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
		body('value').isString().isLength({min: 5, max: 255}),
	];
	
	router.put('/', validate, auth(),
		async (req: AuthRequest<{}, UserData | ErrorResponse, RqBody>, res: Response<UserData | ErrorResponse>) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: errors.array(),
				});
				return;
			}
			
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
			
			const data = matchedData(req, {locations: ['params', 'body']}) as {
				user_id: number,
				value: string
			};
			const user = await User.byId(data.user_id);
			if (!user) {
				return res.status(404).json({
					type: 'not_found',
					message: 'User not found',
				});
			}
			
			if (currentUser.ID !== user.ID && RoleLevel[currentUser.role] < RoleLevel[Role.ADMIN]) {
				return res.status(403).json({
					type: 'forbidden',
					message: 'Forbidden',
				});
			}
			
			await user.setDisplayName(req.body.value);
			
			res.json(user.data);
		});
}

export default router;
