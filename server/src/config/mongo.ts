import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

/**
 * Connect to MongoDB with connection pooling and automated reconnection
 */
export async function connectMongo(): Promise<boolean> {
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;

  if (!uri) {
    return false;
  }

  try {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) {
      isConnected = true;
      return true;
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`🍃 Connected to MongoDB: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message}. (Falling back to local persistent store)`);
    isConnected = false;
    return false;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1 && isConnected;
}
