import OTPAuth from 'otpauth';
import dotenv from 'dotenv';
import path from 'node:path';

const totpenv = dotenv.config({
	path: path.resolve(process.cwd(), '.env.totp'),
	processEnv: {},
}).parsed!;

const SETTINGS = {
	ISSUER: totpenv.ISSUER!,
	ALGORITHM: totpenv.ALGORITHM!,
	LABEL: totpenv.LABEL!,
	DIGITS: parseInt(totpenv.DIGITS!),
	PERIOD: parseInt(totpenv.PERIOD!),
	SECRET_LENGTH: parseInt(totpenv.SECRET_LENGTH!),
	VALIDATION_WINDOW: parseInt(totpenv.VALIDATION_WINDOW!),
};

class TotpUtils {
	static generateSecret(): OTPAuth.Secret {
		return new OTPAuth.Secret({
			size: SETTINGS.SECRET_LENGTH,
		});
	}
	
	static generateTotp(secret: OTPAuth.Secret | string): OTPAuth.TOTP {
		return new OTPAuth.TOTP({
			issuer: SETTINGS.ISSUER,
			label: SETTINGS.LABEL,
			algorithm: SETTINGS.ALGORITHM,
			digits: SETTINGS.DIGITS,
			period: SETTINGS.PERIOD,
			secret: secret,
		});
	}
	
	static getToken(totp: OTPAuth.TOTP): string {
		return totp.generate();
	}
	
	static verifyToken(totp: OTPAuth.TOTP, token: string): boolean {
		return totp.validate({
			token: token,
			window: SETTINGS.VALIDATION_WINDOW,
		}) != null;
	}
}

export default TotpUtils;
