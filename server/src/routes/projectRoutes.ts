import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  idParamSchema,
} from '../validators/schemas.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  validate({ query: projectQuerySchema }),
  ProjectController.getAllProjects
);

router.get(
  '/:id/details',
  optionalAuth,
  validate({ params: idParamSchema }),
  ProjectController.getProjectDetails
);

router.get(
  '/:id',
  optionalAuth,
  validate({ params: idParamSchema }),
  ProjectController.getProjectById
);

router.post(
  '/',
  validate({ body: createProjectSchema }),
  ProjectController.createProject
);

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateProjectSchema }),
  ProjectController.updateProject
);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateProjectSchema }),
  ProjectController.updateProject
);

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  ProjectController.deleteProject
);

export default router;
