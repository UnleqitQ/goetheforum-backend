import {Router, Request, Response} from 'express';
import {body, param, matchedData, validationResult} from 'express-validator';
import {AuthRequest, auth} from '../../utils/middlewares/AuthMiddleware';
import {ErrorResponse} from '../../types/ErrorResponse';
import * as powUtils from '../../utils/proof-of-work/pow-utils';
import User from '../../utils/user/User';
import {UserData} from '../../types/user/UserData';
import {Role, RoleLevel} from '../../types/Role';

const router = Router({mergeParams: true});

// GET /user/:user_id/proof_of_work
{
	interface RsBody {
		proofOfWork: string | null;
	}
	
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
	];
	
	router.get('/', validate,
		async (req: Request, res: Response<RsBody | ErrorResponse>) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: errors.array(),
				});
				return;
			}
			
			const data = matchedData(req, {locations: ['params']}) as { user_id: number };
			const user = await User.byId(data.user_id);
			if (!user) {
				return res.status(404).json({
					type: 'not_found',
					message: 'User not found',
				});
			}
			
			res.json({proofOfWork: user.proofOfWork});
		});
}

// PUT /user/:user_id/proof_of_work
{
	interface RqBody {
		proofOfWork: string | null;
		/**
		 * Whether to ignore if the previous proof of work has a higher difficulty value.
		 */
		ignorePrevious?: boolean;
	}
	
	const validate = [
		param('user_id').isNumeric().isInt().toInt(),
		body('proofOfWork').optional({values: 'null'}).isString(),
		body('ignorePrevious').optional().isBoolean(),
	];
	
	router.put('/', validate, auth(),
		async (req: AuthRequest<{}, ErrorResponse, RqBody>, res: Response<UserData | ErrorResponse>) => {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: errors.array(),
				});
				return;
			}
			
			if (!('value' in req.body)) {
				return res.status(400).json({
					type: 'invalid_request',
					message: 'Invalid request',
					details: 'Missing value',
				});
			}
			
			if (!req.user) {
				return res.status(500).json({
					type: 'internal_error',
					message: 'User not found',
				});
			}
			
			const currentUser = await User.byId(req.user.id);
			if (!currentUser) {
				return res.status(500).json({
					type: 'internal_error',
					message: 'User not found',
				});
			}
			
			const data = matchedData(req, {locations: ['params']}) as { user_id: number };
			const user = await User.byId(data.user_id);
			if (!user) {
				return res.status(404).json({
					type: 'not_found',
					message: 'User not found',
				});
			}
			
			if (currentUser.ID !== user.ID && RoleLevel[currentUser.role] < RoleLevel[Role.ADMIN]) {
				return res.status(403).json({
					type: 'forbidden',
					message: 'Forbidden',
				});
			}
			
			if (!req.body.ignorePrevious) {
				const previousDifficulty = user.proofOfWorkDifficulty;
				const newDifficulty = User.calculateProofOfWorkDifficulty(user.ID, req.body.proofOfWork);
				if (newDifficulty < previousDifficulty) {
					return res.status(400).json({
						type: 'invalid_request',
						message: 'Invalid request',
						details: 'New proof of work has lower difficulty than the previous one',
					});
				}
			}
			
			await user.setProofOfWork(req.body.proofOfWork);
			
			res.json(user.data);
		});
}

export default router;
