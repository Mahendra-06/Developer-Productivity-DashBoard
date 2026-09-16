import { Router } from 'express';
import { GithubController } from '../controllers/githubController.js';

const router = Router();

router.get('/user', GithubController.getUser);
router.get('/pull-requests', GithubController.getPullRequests);
router.post('/sync-repo', GithubController.syncRepo);
router.get('/repo-analytics', GithubController.getRepoAnalytics);

export default router;
