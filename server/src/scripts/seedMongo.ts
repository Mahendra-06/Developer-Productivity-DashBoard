/**
 * DMetrics — MongoDB Database Seeding Script
 * 
 * Connects to MongoDB via MONGODB_URI and seeds initial users, projects,
 * and tasks with complete relational references and database validation.
 * 
 * Usage:
 *   npm run db:seed
 *   or: npx tsx src/scripts/seedMongo.ts
 */

import { connectMongo, disconnectMongo } from '../config/mongo.js';
import { MongoDatabase } from '../data/mongoDb.js';
import { env } from '../config/env.js';

async function seedMongo() {
  console.log('🚀 DMetrics MongoDB Seeding Script');
  console.log('==================================');

  if (!env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in server/.env.');
    console.error('   Please provide MONGODB_URI (e.g. mongodb://127.0.0.1:27017/dmetrics or MongoDB Atlas URI)');
    process.exit(1);
  }

  const connected = await connectMongo();
  if (!connected) {
    console.error('❌ Failed to establish connection with MongoDB.');
    process.exit(1);
  }

  try {
    const mongoDb = new MongoDatabase();
    await mongoDb.resetData();
    console.log('🎉 MongoDB database successfully seeded with all initial entities!');
    await disconnectMongo();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ MongoDB seeding failed:', error.message);
    await disconnectMongo();
    process.exit(1);
  }
}

seedMongo();
