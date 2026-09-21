import { Router } from 'express';
import { TaskController } from '../controllers/taskController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskQuerySchema,
  idParamSchema,
} from '../validators/schemas.js';

const router = Router();

// Summary metrics (placed before :id route)
router.get('/summary/metrics', optionalAuth, TaskController.getSummaryMetrics);

// List tasks with query filter validation
router.get(
  '/',
  optionalAuth,
  validate({ query: taskQuerySchema }),
  TaskController.getAllTasks
);

// Get single task by ID or key
router.get(
  '/:id',
  optionalAuth,
  validate({ params: idParamSchema }),
  TaskController.getTaskById
);

// Create new task
router.post(
  '/',
  optionalAuth,
  validate({ body: createTaskSchema }),
  TaskController.createTask
);

// Full update task
router.put(
  '/:id',
  optionalAuth,
  validate({ params: idParamSchema, body: updateTaskSchema }),
  TaskController.updateTask
);

// Partial update task
router.patch(
  '/:id',
  optionalAuth,
  validate({ params: idParamSchema, body: updateTaskSchema }),
  TaskController.updateTask
);

// Dedicated status management endpoint
router.patch(
  '/:id/status',
  optionalAuth,
  validate({ params: idParamSchema, body: updateTaskStatusSchema }),
  TaskController.updateTaskStatus
);

// Delete task
router.delete(
  '/:id',
  optionalAuth,
  validate({ params: idParamSchema }),
  TaskController.deleteTask
);

export default router;
