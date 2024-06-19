import {JwtBasicPayload} from './JwtUtils';

export interface JwtRefreshPayload extends JwtBasicPayload {
	session_token: string;
	type: 'refresh';
}
