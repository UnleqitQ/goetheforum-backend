import {Response, Router} from 'express';
import {AuthRequest, auth} from '../../../utils/middlewares/AuthMiddleware';
import Account from '../../../utils/user/Account';
import {ErrorResponse} from '../../../types/ErrorResponse';
import {body, validationResult} from 'express-validator';
import TotpUtils from '../../../utils/totp/TotpUtils';
import QRCode from 'qrcode';

const router = Router();

// USE /add
// Routes for adding a TOTP secret
// Subroutes are /generate, /verify and /cancel
{
	// Map for storing TOTP secrets until they are verified or cancelled
	// This does not need to be stored in a database since it is only temporary and will be deleted after verification, cancellation or after a certain amount of time
	// The key is the user ID (number) and the value is a tuple of the secret (string) and the time it was generated (number)
	const totpSecrets = new Map<number, { secret: string, time: number }>();
	const totpSecretExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds, the time before adding a TOTP secret expires
	
	const addRouter = Router();
	
	// POST /generate
	{
		interface RsBody {
			secret: string;
			qr: string;
		}
		
		addRouter.post('/generate', auth(),
			async (req: AuthRequest, res: Response<RsBody | ErrorResponse>) => {
				// Check if the user already has a TOTP secret
				if (!req.user) {
					return res.status(500).json({
						type: 'internal_server_error',
						message: 'User not found',
					});
				}
				
				const account = await Account.byUserId(req.user.id);
				if (!account) {
					return res.status(404).json({
						type: 'not_found',
						message: 'Account not found',
					});
				}
				
				if (account.otpSecret) {
					return res.status(400).json({
						type: 'totp_already_enabled',
						message: 'TOTP already enabled',
					});
				}
				
				// Generate a TOTP secret
				const secret = TotpUtils.generateSecret();
				const totp = TotpUtils.generateTotp(secret);
				const uri = totp.toString();
				
				// Store the TOTP secret
				totpSecrets.set(req.user.id, {secret: secret.base32, time: Date.now()});
				
				// Generate a QR code
				const qr = await QRCode.toDataURL(uri);
				
				return res.json({
					secret: secret.base32,
					qr: qr,
				});
			});
	}
	
	// POST /verify
	{
		interface RqBody {
			token: string;
			password: string;
		}
		
		interface RsBody {
			success: true;
		}
		
		const validate = [
			body('token').isString(),
			body('password').isString(),
		];
		
		addRouter.post('/verify', validate, auth(),
			async (req: AuthRequest<{}, RsBody | ErrorResponse, RqBody>, res: Response<RsBody | ErrorResponse>) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({
						type: 'invalid_request',
						message: 'Invalid request',
						details: errors.array(),
					});
				}
				
				// Check if the user has a TOTP secret
				if (!req.user) {
					return res.status(500).json({
						type: 'internal_server_error',
						message: 'User not found',
					});
				}
				
				const account = await Account.byUserId(req.user.id);
				if (!account) {
					return res.status(404).json({
						type: 'not_found',
						message: 'Account not found',
					});
				}
				
				if (account.otpSecret) {
					return res.status(400).json({
						type: 'totp_already_enabled',
						message: 'TOTP already enabled',
					});
				}
				
				// Check if a TOTP secret exists and is not expired
				const secret = totpSecrets.get(req.user.id);
				if (!secret || Date.now() - secret.time > totpSecretExpiry) {
					totpSecrets.delete(req.user.id);
					return res.status(400).json({
						type: 'totp_not_found',
						message: 'TOTP not generated or expired',
					});
				}
				
				// Verify the TOTP token
				const totp = TotpUtils.generateTotp(secret.secret);
				if (!TotpUtils.verifyToken(totp, req.body.token)) {
					return res.status(400).json({
						type: 'invalid_token',
						message: 'Invalid token',
					});
				}
				
				// Verify the password
				if (!account.verifyPassword(req.body.password)) {
					return res.status(400).json({
						type: 'invalid_password',
						message: 'Invalid password',
					});
				}
				
				// Enable TOTP
				await account.setOtpSecret(secret.secret);
				
				// Delete the TOTP secret
				totpSecrets.delete(req.user.id);
				
				return res.json({
					success: true,
				});
			},
		);
	}
	
	// POST /cancel
	{
		interface RsBody {
			success: true;
		}
		
		addRouter.post('/cancel', auth(),
			async (req: AuthRequest, res: Response<RsBody | ErrorResponse>) => {
				// Check if the user has a TOTP secret
				if (!req.user) {
					return res.status(500).json({
						type: 'internal_server_error',
						message: 'User not found',
					});
				}
				
				const account = await Account.byUserId(req.user.id);
				if (!account) {
					return res.status(404).json({
						type: 'not_found',
						message: 'Account not found',
					});
				}
				
				if (account.otpSecret) {
					return res.status(400).json({
						type: 'totp_already_enabled',
						message: 'TOTP already enabled',
					});
				}
				
				// Delete the TOTP secret
				totpSecrets.delete(req.user.id);
				
				return res.json({
					success: true,
				});
			},
		);
	}
	
	router.use('/add', addRouter);
}

// POST /remove
{
	interface RqBody {
		validation_type: 'totp' | 'backup_code';
		/**
		 * The TOTP token or backup code
		 */
		token: string;
	}
	
	interface RsBody {
		success: true;
	}
	
	const validate = [
		body('validation_type').isString().isIn(['totp', 'backup_code']),
		body('token').isString(),
	];
	
	router.post('/remove', validate, auth(),
		async (req: AuthRequest<{}, RsBody | ErrorResponse, RqBody>, res: Response<RsBody | ErrorResponse>) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: errors.array(),
				});
			}
			
			// Check if the user has a TOTP secret
			if (!req.user) {
				return res.status(500).json({
					type: 'internal_server_error',
					message: 'User not found',
				});
			}
			
			const account = await Account.byUserId(req.user.id);
			if (!account) {
				return res.status(404).json({
					type: 'not_found',
					message: 'Account not found',
				});
			}
			
			if (!account.otpSecret) {
				return res.status(400).json({
					type: 'totp_not_enabled',
					message: 'TOTP not enabled',
				});
			}
			
			if (req.body.validation_type === 'totp') {
				// Verify the TOTP token
				const totp = TotpUtils.generateTotp(account.otpSecret!);
				if (!TotpUtils.verifyToken(totp, req.body.token)) {
					return res.status(400).json({
						type: 'invalid_token',
						message: 'Invalid token',
					});
				}
			}
			else if (req.body.validation_type === 'backup_code') {
				// Verify the backup code
				if (!await account.useRecoveryCode(req.body.token)) {
					return res.status(400).json({
						type: 'invalid_token',
						message: 'Invalid backup code',
					});
				}
			}
			
			// Remove the TOTP secret
			await account.setOtpSecret(null);
			
			return res.json({
				success: true,
			});
		},
	);
}

// GET /status
{
	interface RsBody {
		enabled: boolean;
	}
	
	router.get('/status', auth(),
		async (req: AuthRequest, res: Response<RsBody | ErrorResponse>) => {
			// Check if the user has a TOTP secret
			if (!req.user) {
				return res.status(500).json({
					type: 'internal_server_error',
					message: 'User not found',
				});
			}
			
			const account = await Account.byUserId(req.user.id);
			if (!account) {
				return res.status(404).json({
					type: 'not_found',
					message: 'Account not found',
				});
			}
			
			return res.json({
				enabled: !!account.otpSecret,
			});
		},
	);
}

export default router;
