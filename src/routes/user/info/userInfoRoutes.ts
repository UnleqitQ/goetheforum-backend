import {Response, Router} from 'express';
import {AuthRequest, auth} from '../../../utils/middlewares/AuthMiddleware';
import UserInfo from '../../../utils/user/UserInfo';
import User from '../../../utils/user/User';
import {ErrorResponse} from '../../../types/ErrorResponse';
import {Role, RoleLevel} from '../../../types/Role';
import {validationResult, param, matchedData, ValidationChain} from 'express-validator';

const userInfoRoutes = <T>(
	validateBody: ValidationChain | ValidationChain[],
	getter: (userInfo: UserInfo) => T | null,
	setter: (userInfo: UserInfo, value: T | null) => Promise<void>,
	check?: (value: T | null, res: Response<null | ErrorResponse>) => boolean,
) => {
	const router = Router({mergeParams: true});
	
	// GET /user/:user_id/info/{param}
	{
		interface RsBody {
			value: T | null;
		}
		
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
				
				const data = matchedData(req, {locations: ['params']}) as { user_id: number };
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
				
				res.json({
					value: getter(userInfo),
				});
			});
	}
	
	// PUT /user/:user_id/info/{param}
	{
		interface RqBody {
			value: T | null;
		}
		
		const validate = [
			param('user_id').isNumeric().isInt().toInt(),
			...(Array.isArray(validateBody) ? validateBody : [validateBody]),
		];
		
		router.put('/', validate, auth(),
			async (req: AuthRequest<{}, null | ErrorResponse, RqBody>, res: Response<null | ErrorResponse>) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					res.status(400).json({
						type: 'invalid_request',
						message: 'Invalid request',
						details: errors.array(),
					});
					return;
				}
				
				if (!('value' in req.body)) {
					return res.status(400).json({
						type: 'invalid_request',
						message: 'Invalid request',
						details: 'Missing value',
					});
				}
				
				// check if user is logged in
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
				
				const data = matchedData(req, {locations: ['params']}) as {
					user_id: number
				};
				const user = await User.byId(data.user_id);
				if (!user) {
					return res.status(404).json({
						type: 'not_found',
						message: 'User not found',
					});
				}
				
				// check if the user is the same as the logged-in user or the logged-in user is an admin
				if (req.user.id !== data.user_id && RoleLevel[currentUser.role] < RoleLevel[Role.ADMIN]) {
					return res.status(403).json({
						type: 'forbidden',
						message: 'Forbidden',
					});
				}
				
				const userInfo = await UserInfo.byUserId(data.user_id);
				if (!userInfo) {
					return res.status(404).json({
						type: 'not_found',
						message: 'User not found',
					});
				}
				
				if (check && !check(req.body.value, res)) {
					return;
				}
				
				await setter(userInfo, req.body.value);
				
				res.send();
			});
	}
	
	// DELETE /user/:user_id/info/{param}
	{
		const validate = [
			param('user_id').isNumeric().isInt().toInt(),
		];
		
		router.delete('/', validate, auth(),
			async (req: AuthRequest, res: Response<null | ErrorResponse>) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					res.status(400).json({
						type: 'invalid_request',
						message: 'Invalid request',
						details: errors.array(),
					});
					return;
				}
				
				// check if user is logged in
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
				
				const data = matchedData(req, {locations: ['params']}) as {
					user_id: number
				};
				const user = await User.byId(data.user_id);
				if (!user) {
					return res.status(404).json({
						type: 'not_found',
						message: 'User not found',
					});
				}
				
				// check if the user is the same as the logged-in user or the logged-in user is an admin
				if (req.user.id !== data.user_id && RoleLevel[currentUser.role] < RoleLevel[Role.ADMIN]) {
					return res.status(403).json({
						type: 'forbidden',
						message: 'Forbidden',
					});
				}
				
				const userInfo = await UserInfo.byUserId(data.user_id);
				if (!userInfo) {
					return res.status(404).json({
						type: 'not_found',
						message: 'User not found',
					});
				}
				
				await setter(userInfo, null);
				
				res.send();
			});
	}
	
	return router;
};

export default userInfoRoutes;
