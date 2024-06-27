import {Router} from 'express';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import fs from 'node:fs';
import yaml from 'yaml';

const filePath = path.resolve(process.cwd(), 'api.yaml');
const file = fs.readFileSync(filePath, 'utf-8');
const swaggerDocument = yaml.parse(file);

const router = Router();

router.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(
	swaggerDocument,
	{
		swaggerOptions: {
			persistAuthorization: true,
		}
	},
));

export default router;
