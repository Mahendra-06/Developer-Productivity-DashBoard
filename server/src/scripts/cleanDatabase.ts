/**
 * DMetrics — Full Database Wipe Script
 * 
 * Cleans 100% of data across all collections in MongoDB:
 * - users
 * - projects
 * - tasks
 * - pullRequests
 * - deployments
 * - auditActivities
 * 
 * And resets the local fallback store.json to an empty state.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { UserModel } from '../models/UserModel.js';
import { ProjectModel } from '../models/ProjectModel.js';
import { TaskModel } from '../models/TaskModel.js';
import { PullRequestModel } from '../models/PullRequestModel.js';
import { DeploymentModel } from '../models/DeploymentModel.js';
import { AuditActivityModel } from '../models/AuditActivityModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

async function cleanDatabase() {
  console.log('🧹 DMetrics Database Cleaning Script');
  console.log('====================================');

  const connected = await connectMongo();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB. Ensure mongod is running.');
    process.exit(1);
  }

  try {
    console.log('⏳ Deleting all documents from MongoDB collections...');

    const [usersResult, projectsResult, tasksResult, prsResult, deploymentsResult, auditResult] = await Promise.all([
      UserModel.deleteMany({}),
      ProjectModel.deleteMany({}),
      TaskModel.deleteMany({}),
      PullRequestModel.deleteMany({}),
      DeploymentModel.deleteMany({}),
      AuditActivityModel.deleteMany({}),
    ]);

    console.log(`✓ Deleted ${usersResult.deletedCount} users`);
    console.log(`✓ Deleted ${projectsResult.deletedCount} projects`);
    console.log(`✓ Deleted ${tasksResult.deletedCount} tasks`);
    console.log(`✓ Deleted ${prsResult.deletedCount} pull requests`);
    console.log(`✓ Deleted ${deploymentsResult.deletedCount} deployments`);
    console.log(`✓ Deleted ${auditResult.deletedCount} audit activities`);

    // Reset local fallback store.json
    if (fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(
        STORE_PATH,
        JSON.stringify({ users: [], projects: [], tasks: [] }, null, 2),
        'utf-8'
      );
      console.log('✓ Reset local store.json to empty state');
    }

    console.log('====================================');
    console.log('✨ All database records wiped cleanly (100% empty slate).');

    await disconnectMongo();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Database wipe failed:', error.message);
    await disconnectMongo();
    process.exit(1);
  }
}

cleanDatabase();
