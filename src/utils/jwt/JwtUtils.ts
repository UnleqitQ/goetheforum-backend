import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'node:path';


const jwtenv = dotenv.config({
	path: path.resolve(process.cwd(), '.env.jwt'),
	processEnv: {},
}).parsed!;

const SETTINGS = {
	access: {
		secret: jwtenv.ACCESS_SECRET!,
		expires: jwtenv.ACCESS_EXPIRATION!,
		issuer: jwtenv.ACCESS_ISSUER!,
	},
	refresh: {
		secret: jwtenv.REFRESH_SECRET!,
		expires: jwtenv.REFRESH_EXPIRATION!,
		issuer: jwtenv.REFRESH_ISSUER!,
	},
	login: {
		secret: jwtenv.LOGIN_SECRET!,
		expires: jwtenv.LOGIN_EXPIRATION!,
		issuer: jwtenv.LOGIN_ISSUER!,
	},
}

export interface JwtBasicPayload {
	user_id: number;
	type: 'access' | 'refresh' | 'login';
}

class JwtUtils {
	static sign(payload: JwtBasicPayload): string {
		return jwt.sign(payload, SETTINGS[payload.type].secret, {
			expiresIn: SETTINGS[payload.type].expires,
			issuer: SETTINGS[payload.type].issuer,
		});
	}
	
	static verify<T extends JwtBasicPayload = JwtBasicPayload>(token: string, type: 'access' | 'refresh' | 'login'): T {
		return jwt.verify(token, SETTINGS[type].secret, {
			issuer: SETTINGS[type].issuer,
		}) as T;
	}
}

export default JwtUtils;
