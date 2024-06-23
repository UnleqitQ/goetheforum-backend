export interface ErrorResponse<D = any> {
	message?: string;
	type?: string;
	longMessage?: string;
	details?: D;
}
