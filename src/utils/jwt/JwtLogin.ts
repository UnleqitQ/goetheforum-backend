import {JwtBasicPayload} from './JwtUtils';
import {VerificationType} from '../../types/VerificationType';

/**
 * Jwt payload when user tries to login to an account with multi factor authentication
 */
export interface JwtLoginPayload extends JwtBasicPayload {
	type: 'login';
	
	/**
	 * The verification types that were used to verify the user
	 */
	verification_types: VerificationType[];
}
