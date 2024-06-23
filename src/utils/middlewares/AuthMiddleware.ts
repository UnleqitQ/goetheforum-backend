import {Request, Response, NextFunction} from 'express';
import core from 'express-serve-static-core';
import jwt, {JwtBasicPayload} from '../jwt/JwtUtils';


export interface AuthRequest<
	JwtPayload extends Record<string, any> = JwtBasicPayload,
	P = core.ParamsDictionary,
	ResBody = any,
	ReqBody = any,
	ReqQuery = core.Query,
	Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
	user?: {
		id: number;
		token: string;
		payload: JwtPayload;
	};
}

interface AuthOptions {
	/**
	 * Whether the user must be authenticated.
	 * 'necessary' means the user must be authenticated.
	 * 'valid' means if the user is authenticated, the user must have a valid token, otherwise the user can be unauthenticated.
	 * 'unnecessary' means the user can be authenticated or unauthenticated, if the toke is invalid, the user will be treated as unauthenticated.
	 */
	rule: 'necessary' | 'valid' | 'unnecessary';
	/**
	 * What token type is required.
	 */
	type: 'access' | 'refresh' | 'login';
}

/**
 * Middleware to check if the user is authenticated.
 * @param options Options for the middleware.
 */
export const auth = (
	options: Partial<AuthOptions> = {rule: 'valid', type: 'access'},
): ((
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => void) => {
	const rule = options.rule || 'valid';
	const type = options.type || 'access';
	if (!(rule in ['necessary', 'valid', 'unnecessary'])) {
		throw new Error('Invalid rule');
	}
	if (!(type in ['access', 'refresh', 'login'])) {
		throw new Error('Invalid type');
	}
	
	return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		const auth = req.headers.authorization;
		if (!auth) {
			if (rule === 'necessary') {
				res.status(401).send('Unauthorized');
				return;
			}
			req.user = undefined;
			next();
			return;
		}
		const [tokenType, token] = auth.split(' ');
		if (tokenType !== 'Bearer') {
			if (rule === 'unnecessary') {
				req.user = undefined;
				next();
				return;
			}
			res.status(401).send('Unauthorized');
			return;
		}
		
		try {
			const payload = jwt.verify(token, type);
			req.user = {
				id: payload.user_id,
				token,
				payload,
			};
			next();
		} catch (e) {
			if (rule === 'unnecessary') {
				req.user = undefined;
				next();
				return;
			}
			res.status(401).send('Unauthorized');
		}
	};
};
