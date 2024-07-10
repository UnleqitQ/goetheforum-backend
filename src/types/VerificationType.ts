export const VerificationType = {
	/**
	 * The user verified using a password
	 */
	password: 'password',
	/**
	 * The user verified using an email
	 */
	email: 'email',
	/**
	 * The user verified using TOTP
	 */
	totp: 'totp',
	/**
	 * The user verified using a backup code
	 */
	backup_code: 'backup_code',
} as const;

export type VerificationType = typeof VerificationType[keyof typeof VerificationType];

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
