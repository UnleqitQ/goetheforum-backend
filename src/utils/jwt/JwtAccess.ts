import {JwtBasicPayload} from './JwtUtils';

export interface JwtAccessPayload extends JwtBasicPayload {
	session_token: string;
	type: 'access';
}
