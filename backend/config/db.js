const mongoose = require('mongoose');

// Cache connection across serverless invocations (Vercel/Lambda compatible)
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/viruscare', {
        bufferCommands: false,
      })
      .then((m) => {
        console.log(`[Database] MongoDB Connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
