import {Request, Response, Router} from 'express';
import {body, validationResult} from 'express-validator';
import {ErrorResponse} from '../../types/ErrorResponse';
import User from '../../utils/user/User';
import Account from '../../utils/user/Account';
import Session from '../../utils/user/Session';
import {UserData} from '../../types/user/UserData';
import {VerificationType, VerificationTypeRules} from '../../types/VerificationType';
import JwtUtils from '../../utils/jwt/JwtUtils';
import {JwtLoginPayload} from '../../utils/jwt/JwtLogin';
import {Role} from '../../types/Role';
import TotpUtils from '../../utils/totp/TotpUtils';

/*
The login may consist of multiple steps depending on the authentication method and the settings of the user.
 */

const router = Router();

// Request body types
interface PwBody {
	verification_type: 'password';
	/**
	 * The password of the user
	 */
	password: string;
}

interface TotpBody {
	verification_type: 'totp';
	/**
	 * The TOTP code of the user
	 */
	totp: string;
}

interface BackupCodeBody {
	verification_type: 'backup_code';
	/**
	 * The backup code of the user
	 */
	backup_code: string;
}

interface EmailBody {
	verification_type: 'email';
	/**
	 * The email verification code
	 */
	email_code: string;
}

type AuthBody = PwBody | TotpBody | BackupCodeBody | EmailBody;

type RqInitBody = ({
	/**
	 * The username of the user
	 */
	username: string;
} | {
	/**
	 * The email of the user
	 */
	email: string;
}) & AuthBody;

type RqStepBody = {
	/**
	 * The login token
	 */
	token: string;
} & AuthBody;

type RqBody = RqInitBody | RqStepBody;

// Response body types
interface RsIntermediaryBody {
	/**
	 * The status of the login
	 */
	status: 'intermediary';
	
	/**
	 * The verification types that were used to verify the user
	 */
	previous: VerificationType[];
	/**
	 * The verification types that can still be used to verify the user
	 */
	next: VerificationType[];
	
	/**
	 * The login token
	 */
	token: string;
}

interface RsFinalBody {
	/**
	 * The status of the login
	 */
	status: 'complete';
	
	/**
	 * The user data
	 */
	user: UserData;
	/**
	 * The access token of the user
	 */
	access_token: string;
	/**
	 * The refresh token of the user
	 */
	refresh_token: string;
}

type RsBody = RsIntermediaryBody | RsFinalBody;

const validate = [
	body('verification_type').isString().isIn(['password', 'totp', 'backup_code', 'email']),
	body('password').isString().optional(),
	body('totp').isString().optional(),
	body('backup_code').isString().optional(),
	body('email_code').isString().optional(),
	
	body('username').isString().optional(),
	body('email').isEmail().optional(),
	
	body('token').isString().optional(),
];

const isVerificationTypeBlocked = (previous: VerificationType[], current: VerificationType): boolean => {
	return previous.some(vt => VerificationTypeRules[vt].block.includes(current));
};

router.post('/', validate,
	async (req: Request<{}, RsBody | ErrorResponse, RqBody>, res: Response<RsBody | ErrorResponse>) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.status(400).json({
				type: 'invalid_request',
				message: 'Invalid request',
				details: errors.array(),
			});
			return;
		}
		
		const verificationType = req.body.verification_type;
		// Check if the verification type is matching the request body
		{
			switch (verificationType) {
				case 'password':
					if (!req.body.password) {
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							details: [{
								location: 'body',
								param: 'password',
								msg: 'Password is required',
							}],
						});
						return;
					}
					break;
				case 'totp':
					if (!req.body.totp) {
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							details: [{
								location: 'body',
								param: 'totp',
								msg: 'TOTP is required',
							}],
						});
						return;
					}
					break;
				case 'backup_code':
					if (!req.body.backup_code) {
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							details: [{
								location: 'body',
								param: 'backup_code',
								msg: 'Backup code is required',
							}],
						});
						return;
					}
					break;
				case 'email':
					if (!req.body.email_code) {
						res.status(400).json({
							type: 'invalid_request',
							message: 'Invalid request',
							details: [{
								location: 'body',
								param: 'email_code',
								msg: 'Email code is required',
							}],
						});
						return;
					}
					break;
			}
		}
		
		const username = 'username' in req.body ? req.body.username : null;
		const email = 'email' in req.body ? req.body.email : null;
		const token = 'token' in req.body ? req.body.token : null;
		
		if (!username && !email && !token) {
			res.status(400).json({
				type: 'invalid_request',
				message: 'Invalid request',
				longMessage: 'Username, email or token is required',
			});
			return;
		}
		
		if (username && email) {
			res.status(400).json({
				type: 'invalid_request',
				message: 'Invalid request',
				longMessage: 'Username and email cannot be used at the same time',
			});
			return;
		}
		
		let payload: JwtLoginPayload | null = null;
		if (token) {
			try {
				payload = JwtUtils.verify<JwtLoginPayload>(token, 'login');
			}
			catch (e) {
				res.status(401).json({
					type: 'invalid_token',
					message: 'Invalid token',
				});
				return;
			}
		}
		
		if (token && !payload) {
			res.status(401).json({
				type: 'invalid_token',
				message: 'Invalid token',
			});
			return;
		}
		
		let user = token ? await User.byId(payload!.user_id) :
			username ? await User.byUsername(username) :
				email ? await User.byEmail(email) : null;
		
		if (!user) {
			res.status(404).json({
				type: 'not_found',
				message: 'User not found',
			});
			return;
		}
		
		if (user.deleted) {
			res.status(403).json({
				type: 'deleted',
				message: 'User is deleted',
			});
			return;
		}
		
		if (user.role === Role.SYSTEM) {
			res.status(403).json({
				type: 'forbidden',
				message: 'System user cannot login',
			});
			return;
		}
		
		const account = await Account.byUserId(user.ID);
		if (!account) {
			res.status(500).json({
				type: 'internal_error',
				message: 'Could not find account',
			});
			return;
		}
		
		if (payload && isVerificationTypeBlocked(payload.verification_types, verificationType)) {
			res.status(400).json({
				type: 'invalid_request',
				message: 'Verification type is blocked by previous verification type',
			});
			return;
		}
		
		if (verificationType == 'email') {
			res.status(400).json({
				type: 'invalid_request',
				message: 'Email verification is not yet supported',
			});
			return;
		}
		else if (verificationType == 'password') {
			if (!account.verifyPassword(req.body.password)) {
				res.status(401).json({
					type: 'invalid_password',
					message: 'Invalid password',
				});
				return;
			}
		}
		else if (verificationType == 'totp') {
			const secret = account.otpSecret;
			if (!secret) {
				res.status(400).json({
					type: 'totp_not_enabled',
					message: 'TOTP is not enabled',
				});
				return;
			}
			if (!TotpUtils.verifyToken(TotpUtils.generateTotp(secret), req.body.totp)) {
				res.status(401).json({
					type: 'invalid_totp',
					message: 'Invalid TOTP token',
				});
				return;
			}
		}
		else if (verificationType == 'backup_code') {
			if (!await account.useRecoveryCode(req.body.backup_code)) {
				res.status(401).json({
					type: 'invalid_backup_code',
					message: 'Invalid backup code',
				});
				return;
			}
		}
		else {
			res.status(400).json({
				type: 'invalid_request',
				message: 'Invalid verification type',
			});
			return;
		}
		
		const previous = payload ? payload.verification_types : [];
		const used = [...previous, verificationType];
		const available = Object.values(VerificationType)
		.filter(vt => !isVerificationTypeBlocked(used, vt));
		
		const isFinal = used.length >= 1;
		if (isFinal) {
			const session = await Session.create(user.ID);
			if (!session) {
				res.status(500).json({
					type: 'internal_error',
					message: 'Could not create session',
				});
				return;
			}
			
			const response: RsFinalBody = {
				status: 'complete',
				user: user.data,
				access_token: session.accessToken,
				refresh_token: session.refreshToken,
			};
			res.json(response);
		}
		else {
			const newPayload: JwtLoginPayload = {
				type: 'login',
				user_id: user.ID,
				verification_types: used,
			};
			const newToken = JwtUtils.sign(newPayload);
			
			const response: RsIntermediaryBody = {
				status: 'intermediary',
				previous: used,
				next: available,
				token: newToken,
			};
			res.json(response);
		}
	},
);

export default router;
