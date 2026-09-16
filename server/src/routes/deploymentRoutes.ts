import { Router } from 'express';
import { DeploymentController } from '../controllers/deploymentController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { 
  createDeploymentSchema, 
  updateDeploymentSchema, 
  deploymentQuerySchema, 
  idParamSchema 
} from '../validators/schemas.js';

const router = Router();

// 1. Metric & Aggregation Routes (defined before /:id parameter)
router.get('/metrics', optionalAuth, DeploymentController.getDeploymentMetrics);
router.get('/trends', optionalAuth, DeploymentController.getDeploymentTrends);
router.get('/environments', optionalAuth, DeploymentController.getDeploymentEnvironments);

// 2. Main CRUD Collection Routes
router.get('/', optionalAuth, validate({ query: deploymentQuerySchema }), DeploymentController.getAllDeployments);
router.get('/:id', validate({ params: idParamSchema }), DeploymentController.getDeploymentById);
router.post('/', optionalAuth, validate({ body: createDeploymentSchema }), DeploymentController.createDeployment);
router.patch('/:id', validate({ params: idParamSchema, body: updateDeploymentSchema }), DeploymentController.updateDeployment);
router.delete('/:id', validate({ params: idParamSchema }), DeploymentController.deleteDeployment);

export default router;

