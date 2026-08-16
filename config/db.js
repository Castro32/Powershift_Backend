import mongoose from 'mongoose';

// Vercel serverless functions can receive concurrent invocations, and each
// cold start would otherwise open a fresh connection. We cache the promise
// on the global object so warm invocations reuse the same connection pool.

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => {
        console.log('✅ MongoDB connected');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next request instead of caching a rejected promise
    throw err;
  }

  return cached.conn;
}

// Express middleware — ensures DB is connected before any route handler runs.
export async function ensureDB(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
}
