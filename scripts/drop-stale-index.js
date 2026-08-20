// Drops a leftover unique index on 'paymentIntentId' from an earlier schema
// version. The current Booking model has no such field, so every document
// implicitly has paymentIntentId: null — and a UNIQUE index only allows one
// document with that value. That's why only your very first booking write
// succeeded and every one since has failed with an E11000 duplicate key error.
//
// Safe to run any time; it's a no-op if the index has already been removed.
//   node scripts/drop-stale-index.js

import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.collection('bookings');
  const indexes = await collection.indexes();
  console.log('Current indexes on bookings:', indexes.map((i) => i.name));

  const stale = indexes.find((i) => i.name === 'paymentIntentId_1');
  if (!stale) {
    console.log('No paymentIntentId_1 index found — nothing to do.');
  } else {
    await collection.dropIndex('paymentIntentId_1');
    console.log('Dropped stale index: paymentIntentId_1');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error('Failed to drop index:', err.message);
  process.exit(1);
});