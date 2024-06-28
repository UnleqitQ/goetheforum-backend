import {Request, Response, Router} from 'express';
import {ErrorResponse} from '../../types/ErrorResponse';
import {matchedData, validationResult, param, body} from 'express-validator';
import User from '../../utils/user/User';
import {UserData} from '../../types/user/UserData';
import {Role, RoleLevel} from '../../types/Role';
import {AuthRequest, auth} from '../../utils/middlewares/AuthMiddleware';
import ImageUtils, {ImageCheck} from '../../utils/image/ImageUtils';

const AVATAR_SETTINGS: ImageCheck = {
	fileSize: {
		max: 1024 * 1024, // max 1 MiB
	},
	width: {
		min: 50,
		max: 300,
	},
	height: {
		min: 50,
		max: 300,
	},
	aspectRatio: 1,
	format: 'png', // Only PNG format is allowed
};

const router = Router({mergeParams: true});

// GET /user/:user_id/avatar
{
	interface RsBody {
		value: string | null;
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
			
			res.json({value: user.avatarBase64});
		});
}

// PUT /user/:user_id/avatar
{
	interface RqBody {
		value: string | null;
	}
	
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
		body('value').optional({values: 'null'}).isString().isBase64(),
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
			
			if (!('value' in req.body)) {
				return res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: 'Missing value',
				});
			}
			
			if (!req.user) {
				return res.status(500).json({
					type: 'internal_error',
					message: 'User not found',
				});
			}
			
			const currentUser = await User.byId(req.user.id);
			if (!currentUser) {
				return res.status(500).json({
					type: 'internal_error',
					message: 'User not found',
				});
			}
			
			const data = matchedData(req, {locations: ['params']}) as { user_id: number };
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
			
			if (req.body.value !== null) {
				const result = ImageUtils.checkImage(req.body.value, AVATAR_SETTINGS);
				if (result !== true) {
					switch (result) {
						case 'fileSize':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'File size is too large (max 1 MiB)',
							});
						case 'dimensions':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'Invalid dimensions (50x50 - 300x300)',
							});
						case 'aspectRatio':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'Invalid aspect ratio (1:1)',
							});
						case 'format':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'Invalid format (PNG only)',
							});
						case 'invalid':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'The data is not an image or is corrupted',
							});
						default:
							return res.status(500).json({
								type: 'internal_server_error',
								message: 'Unknown error',
							});
					}
				}
			}
			
			await user.setAvatar(req.body.value);
			
			res.json(user.data);
		});
}

// DELETE /user/:user_id/avatar
{
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
	];
	
	router.delete('/', validate, auth(),
		async (req: AuthRequest, res: Response<UserData | ErrorResponse>) => {
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
					type: 'internal_error',
					message: 'User not found',
				});
			}
			
			const currentUser = await User.byId(req.user.id);
			if (!currentUser) {
				return res.status(500).json({
					type: 'internal_error',
					message: 'User not found',
				});
			}
			
			const data = matchedData(req, {locations: ['params']}) as { user_id: number };
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
			
			await user.setAvatar(null);
			
			res.json(user.data);
		});
}

export default router;
