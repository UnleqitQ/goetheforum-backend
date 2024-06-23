import {Request, Response, NextFunction} from 'express';
import core from 'express-serve-static-core';
import {ErrorResponse} from '../../types/ErrorResponse';
import Session from '../user/Session';


export interface AuthRequest<
	P = core.ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = core.Query,
	Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
	user?: {
		id: number;
		token: string;
		session_token: string;
		session_id: number;
	};
}

/**
 * Middleware to check if the user is authenticated.
 * @param type The token type required.
 * @param rule The rule to follow.
 * 'necessary' means the user must be authenticated and have a valid token.
 * 'valid' means if the user is authenticated, the user must have a valid token, otherwise the user can be unauthenticated.
 * 'unnecessary' means the user can be authenticated or unauthenticated, if the toke is invalid, the user will be treated as unauthenticated.
 * @return The middleware.
 */
export const auth = (
	type: 'access' | 'refresh' = 'access',
	rule: 'necessary' | 'valid' | 'unnecessary' = 'necessary',
): ((
	req: AuthRequest,
	res: Response<ErrorResponse>,
	next: NextFunction,
) => void) => {
	if (!(rule in ['necessary', 'valid', 'unnecessary'])) {
		throw new Error('Invalid rule');
	}
	if (!(type in ['access', 'refresh'])) {
		throw new Error('Invalid type');
	}
	
	return async (req: AuthRequest<any, any, ErrorResponse>, res: Response<ErrorResponse>, next: NextFunction) => {
		const auth = req.headers.authorization;
		if (!auth) {
			if (rule === 'necessary') {
				res.status(401).json({
					message: 'Unauthorized',
					type: 'unauthorized',
					longMessage: 'No token provided',
				});
				return;
			}
			req.user = undefined;
			next();
			return;
		}
		const [tokenType, token] = auth.split(' ');
		if (tokenType !== 'Bearer' || !token) {
			if (rule === 'unnecessary') {
				req.user = undefined;
				next();
				return;
			}
			res.status(400).json({
				message: 'Invalid token',
				type: 'invalid_token',
				longMessage: 'The token is invalid or not provided correctly (Bearer token)',
			});
			return;
		}
		
		const session = type === 'access' ? await Session.byAccessToken(
			token) : await Session.byRefreshToken(token);
		if (!session) {
			if (rule === 'unnecessary') {
				req.user = undefined;
				next();
				return;
			}
			res.status(400).json({
				message: 'Invalid token',
				type: 'invalid_token',
				longMessage: 'The token is invalid',
			});
			return;
		}
		
		req.user = {
			id: session.userId,
			token,
			session_token: session.accessToken,
			session_id: session.ID,
		};
		next();
	};
};
