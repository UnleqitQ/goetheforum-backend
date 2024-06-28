import {Request, Response, Router} from 'express';
import info from './info';
import {UserData} from '../../types/user/UserData';
import {ErrorResponse} from '../../types/ErrorResponse';
import {matchedData, param, validationResult} from 'express-validator';
import user from '../../utils/user/User';
import User from '../../utils/user/User';
import UserInfo from '../../utils/user/UserInfo';
import display_name from './display_name';

const router = Router();

// Get /user/:user_id
{
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
	];
	
	router.get('/:user_id', validate,
		async (req: Request, res: Response<UserData | ErrorResponse>) => {
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
			
			res.json(user.data);
		});
}

router.use('/:user_id/info', info);
router.use('/:user_id/display_name', display_name);

export default router;
