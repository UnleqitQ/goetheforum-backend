import {Request, Response, Router} from 'express';
import UserInfo from '../../../utils/user/UserInfo';
import {UserInfoData} from '../../../types/user/UserInfoData';
import {AuthRequest, auth} from '../../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../../types/ErrorResponse';
import User from '../../../utils/user/User';
import {Role, RoleLevel} from '../../../types/Role';
import {validationResult, param, matchedData, body} from 'express-validator';
import ImageUtils from '../../../utils/image/ImageUtils';

import userInfoRoutes from './userInfoRoutes';

// Param for all routes: ':user_id'
const router = Router({mergeParams: true});

// Profile picture settings
const PROFILE_PICTURE_SETTINGS = {
	fileSize: { // up to 5 MiB
		max: 5 * 1024 * 1024,
	},
	width: {
		min: 10,
		max: 4000,
	},
	height: {
		min: 10,
		max: 4000,
	},
	format: 'png',
};

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
			
			res.json(userInfo.data);
		});
}

// PATCH /user/:user_id/info
{
	type RqBody = Partial<UserInfoData>;
	type RsBody = UserInfoData;
	// We need to differentiate between undefined and null
	// undefined means the field is not changed
	// null means the field is set to null
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
		body('userId').not().exists().withMessage('Cannot change user ID'),
		body('profilePicture').optional({values: 'null'}).isString().isBase64(),
		body('bio').optional({values: 'null'}).isString(),
		body('website').optional({values: 'null'}).isString().isLength({max: 255}).isURL(),
		body('location').optional({values: 'null'}).isString().isLength({max: 255}),
		body('dateOfBirth').optional({values: 'null'}).isDate(),
		body('phoneNumber').optional({values: 'null'}).isString().isLength({max: 15}),
		body('preferredLanguage').optional({values: 'null'}).isString().isLength({min: 2, max: 2}),
		body('languages').optional({values: 'null'}).isArray(),
		body('languages.*').isString().isLength({min: 2, max: 2}),
	];
	
	router.patch('/', validate, auth(),
		async (req: AuthRequest<{}, RsBody | ErrorResponse, RqBody>, res: Response<RsBody | ErrorResponse>) => {
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
			
			// Check the image
			if (!!req.body.profilePicture) {
				const result = ImageUtils.checkImage(req.body.profilePicture, PROFILE_PICTURE_SETTINGS);
				if (result !== true) {
					switch (result) {
						case 'fileSize':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'Profile picture is too large (max 5 MiB)',
							});
						case 'dimensions':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'Invalid dimensions (Accepts only 10x10 to 4000x4000)',
							});
						case 'format':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'Invalid format (Accepts only PNG)',
							});
						case 'invalid':
							return res.status(400).json({
								type: 'invalid_request',
								message: 'Invalid request',
								longMessage: 'The image is invalid (corrupted or not an image)',
							});
						default:
							return res.status(500).json({
								type: 'internal_server_error',
								message: 'Unknown error',
							});
					}
				}
			}
			
			// update the user info
			await userInfo.update(req.body);
			
			res.json(userInfo.data);
		});
}

// Sub-routes
{
	router.use('/profile_picture', userInfoRoutes<string>(
		body('value').optional({values: 'null'}).isString().isBase64(),
		userInfo => userInfo.profilePictureBase64,
		(userInfo, value) => userInfo.setProfilePicture(value),
		(value, res) => {
			if (value === null) {
				return true;
			}
			const result = ImageUtils.checkImage(value, PROFILE_PICTURE_SETTINGS);
			if (result !== true) {
				switch (result) {
					case 'fileSize':
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							longMessage: 'Profile picture is too large (max 5 MiB)',
						});
						return false;
					case 'dimensions':
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							longMessage: 'Invalid dimensions (Accepts only 10x10 to 4000x4000)',
						});
						return false;
					case 'format':
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							longMessage: 'Invalid format (Accepts only PNG)',
						});
						return false;
					case 'invalid':
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							longMessage: 'The image is invalid (corrupted or not an image)',
						});
						return false;
					default:
						res.status(500).json({
							type: 'internal_server_error',
							message: 'Unknown error',
						});
						return false;
				}
			}
			return true;
		},
	));
	
	router.use('/bio', userInfoRoutes<string>(
		body('value').optional({values: 'null'}).isString(),
		userInfo => userInfo.bio,
		(userInfo, value) => userInfo.setBio(value),
	));
	
	router.use('/website', userInfoRoutes<string>(
		body('value').optional({values: 'null'}).isString().isLength({max: 255}).isURL(),
		userInfo => userInfo.website,
		(userInfo, value) => userInfo.setWebsite(value),
	));
	
	router.use('/location', userInfoRoutes<string>(
		body('value').optional({values: 'null'}).isString().isLength({max: 255}),
		userInfo => userInfo.location,
		(userInfo, value) => userInfo.setLocation(value),
	));
	
	router.use('/date_of_birth', userInfoRoutes<Date>(
		body('value').optional({values: 'null'}).isDate(),
		userInfo => userInfo.dateOfBirth,
		(userInfo, value) => userInfo.setDateOfBirth(value),
	));
	
	router.use('/phone_number', userInfoRoutes<string>(
		body('value').optional({values: 'null'}).isString().isLength({max: 15}),
		userInfo => userInfo.phoneNumber,
		(userInfo, value) => userInfo.setPhoneNumber(value),
	));
	
	router.use('/preferred_language', userInfoRoutes<string>(
		body('value').optional({values: 'null'}).isString().isLength({min: 2, max: 2}),
		userInfo => userInfo.preferredLanguage,
		(userInfo, value) => userInfo.setPreferredLanguage(value),
	));
	
	router.use('/languages', userInfoRoutes<string[]>(
		[
			body('value').optional({values: 'null'}).isArray(),
			body('value.*').isString().isLength({min: 2, max: 2}),
		],
		userInfo => userInfo.languagesArray,
		(userInfo, value) => userInfo.setLanguagesArray(value),
	));
}


export default router;
