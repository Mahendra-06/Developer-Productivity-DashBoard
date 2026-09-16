import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import prRoutes from './prRoutes.js';
import auditRoutes from './auditRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import deploymentRoutes from './deploymentRoutes.js';
import aiRoutes from './aiRoutes.js';
import githubRoutes from './githubRoutes.js';

const router = Router();

// Modular, Domain-Driven REST Endpoints
router.use('/', healthRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/prs', prRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/audit', auditRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/github', githubRoutes);

export default router;
