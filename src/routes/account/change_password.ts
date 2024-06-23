import {Response, Router} from 'express';
import {auth, AuthRequest} from '../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../types/ErrorResponse';
import Account from '../../utils/user/Account';
import {body, validationResult} from 'express-validator';

const router = Router();

interface RqBody {
	old_password: string;
	new_password: string;
}

interface RsBody {
	success: boolean;
}

const validate = [
	body('old_password').isString(),
	body('new_password').isString().isLength({min: 8}),
];

router.post('/', validate, auth(),
	async (req: AuthRequest<{}, RsBody | ErrorResponse, RqBody>, res: Response<RsBody | ErrorResponse>) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				type: 'invalid_request',
				message: 'Invalid request',
				details: errors.array(),
			});
		}
		
		if (!req.user) {
			return res.status(500).json({
				type: 'internal_server_error',
				message: 'User not found',
			});
		}
		
		const {old_password, new_password} = req.body;
		const account = await Account.byUserId(req.user!.id);
		if (!account) {
			return res.status(404).json({
				type: 'not_found',
				message: 'Account not found',
			});
		}
		
		if (!account.verifyPassword(old_password)) {
			return res.status(400).json({
				type: 'invalid_password',
				message: 'Invalid password',
				longMessage: 'The old password is not correct',
			});
		}
		
		await account.setPassword(new_password);
		
		return res.json({
			success: true,
		});
	},
);

export default router;
