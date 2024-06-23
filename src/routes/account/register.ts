import {Router, Request, Response} from 'express';
import {body, validationResult} from 'express-validator';
import {ErrorResponse} from '../../types/ErrorResponse';
import User from '../../utils/user/User';
import Account from '../../utils/user/Account';
import Session from '../../utils/user/Session';
import {UserData} from '../../types/user/UserData';

const router = Router();

interface RqBody {
	/**
	 * The username of the user
	 * Length: 5-250 characters
	 */
	username: string;
	/**
	 * The email of the user
	 */
	email: string;
	/**
	 * The password of the user (plaintext)
	 * (Even if it was hashed at the client, if the connection is intercepted,
	 * the attacker could just send the hashed password to the server, as I can't really check that.
	 * So, it actually doesn't matter if the password is sent in plaintext or hashed, as long as the connection is secure.)<br>
	 * Minimum length: 8 characters
	 */
	password: string;
}

interface RsBody {
	/**
	 * The username of the user
	 */
	username: string;
	/**
	 * The email of the user
	 */
	email: string;
	/**
	 * The id of the user
	 */
	user_id: number;
	/**
	 * The id of the account
	 */
	account_id: number;
	/**
	 * The access token of the user
	 */
	access_token: string;
	/**
	 * The refresh token of the user
	 */
	refresh_token: string;
	/**
	 * The user data
	 */
	user: UserData;
}

const validate = [
	body('username').isString().isLength({min: 5, max: 250}),
	body('email').isEmail(),
	body('password').isString().isLength({min: 8}),
];
router.post('/', validate,
	async (req: Request<{}, RsBody | ErrorResponse, RqBody>, res: Response<RsBody | ErrorResponse>) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				type: 'invalid_request',
				message: 'Invalid request',
				details: errors.array(),
			});
		}
		
		const {username, email, password} = req.body;
		// Check if the username is already taken
		{
			const taken = await User.isUsernameTaken(username);
			if (taken) {
				return res.status(400).json({
					type: 'already_used',
					message: 'Username is already taken',
				});
			}
		}
		// Check if the email is already taken
		{
			const taken = await User.isEmailTaken(email);
			if (taken) {
				return res.status(400).json({
					type: 'already_used',
					message: 'Email is already taken',
				});
			}
		}
		
		const user = await User.create(username, email);
		const account = await Account.create(user.ID, password);
		const session = await Session.create(user.ID);
		
		return res.json({
			username: user.username!,
			email: user.email!,
			user_id: user.ID,
			account_id: account.ID,
			access_token: session.accessToken,
			refresh_token: session.refreshToken,
			user: user.data,
		});
	},
);

export default router;
