// MongoDB initialization script for ReZ DLQ Service
// This runs on first container start to set up indexes and initial data

db = db.getSiblingDB('rez_dlq');

// Create collections explicitly (optional, MongoDB creates on first insert)
db.createCollection('dlqentries');

// Create indexes for optimal query performance
db.dlqentries.createIndex({ "eventId": 1 }, { unique: true });
db.dlqentries.createIndex({ "eventType": 1 });
db.dlqentries.createIndex({ "status": 1 });
db.dlqentries.createIndex({ "tags": 1 });
db.dlqentries.createIndex({ "createdAt": -1 });
db.dlqentries.createIndex({ "status": 1, "createdAt": -1 });
db.dlqentries.createIndex({ "eventType": 1, "status": 1 });
db.dlqentries.createIndex({ "tags": 1, "status": 1 });
db.dlqentries.createIndex({ "nextReplayAt": 1 }, { sparse: true });

// Create TTL index to auto-expire old replayed/discarded events after 30 days
db.dlqentries.createIndex(
  { "updatedAt": 1 },
  { expireAfterSeconds: 2592000, partialFilterExpression: { "status": { $in: ["replayed", "discarded"] } } }
);

print('ReZ DLQ MongoDB initialization complete');
