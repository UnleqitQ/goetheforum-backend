export type VerificationType = 'password' | 'email' | 'totp' | 'backup_code';

export const VerificationTypeRules: {
	[key in VerificationType]: {
		/**
		 * Verification types that are blocked when this verification type was used to verify the user
		 */
		block: VerificationType[];
	}
} = {
	password: {
		block: ['password'],
	},
	email: {
		block: ['email'],
	},
	totp: {
		block: ['totp', 'backup_code'],
	},
	backup_code: {
		block: ['backup_code', 'totp'],
	},
};
