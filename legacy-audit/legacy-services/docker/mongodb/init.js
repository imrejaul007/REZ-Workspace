// ============================================
// REZ Workspace - MongoDB Initialization Script
// Runs on first container start
// ============================================

// Create application database
db = db.getSiblingDB('rez-workspace');

// Create application user
db.createUser({
    user: 'rezuser',
    pwd: 'rezpassword', // Should be overridden by environment
    roles: [
        { role: 'readWrite', db: 'rez-workspace' },
        { role: 'dbAdmin', db: 'rez-workspace' }
    ]
});

// Switch to application database
db = db.getSiblingDB('rez-workspace');

// Create collections with validators
db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'email', 'password'],
            properties: {
                name: { bsonType: 'string', minimumLength: 1, maximumLength: 100 },
                email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
                password: { bsonType: 'string', minimumLength: 6 }
            }
        }
    }
});

db.createCollection('workspaces');
db.createCollection('channels');
db.createCollection('messages');
db.createCollection('meetings');
db.createCollection('documents');
db.createCollection('tasks');
db.createCollection('projects');
db.createCollection('calendar_events');
db.createCollection('workflows');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ workspaces: 1 });

db.workspaces.createIndex({ owner_id: 1 });
db.workspaces.createIndex({ members: 1 });

db.channels.createIndex({ workspace_id: 1 });
db.channels.createIndex({ workspace_id: 1, name: 1 });
db.channels.createIndex({ members: 1 });

db.messages.createIndex({ channel_id: 1, timestamp: -1 });
db.messages.createIndex({ sender_id: 1 });
db.messages.createIndex({ thread_id: 1 });

db.meetings.createIndex({ host_id: 1 });
db.meetings.createIndex({ attendee_ids: 1 });
db.meetings.createIndex({ start_time: 1 });
db.meetings.createIndex({ workspace_id: 1 });

db.documents.createIndex({ workspace_id: 1 });
db.documents.createIndex({ created_by: 1 });
db.documents.createIndex({ tags: 1 });
db.documents.createIndex({ title: 'text', content: 'text' });

db.tasks.createIndex({ workspace_id: 1 });
db.tasks.createIndex({ assignee_id: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ due_date: 1 });

db.projects.createIndex({ workspace_id: 1 });
db.projects.createIndex({ owner_id: 1 });

db.calendar_events.createIndex({ user_id: 1 });
db.calendar_events.createIndex({ workspace_id: 1 });
db.calendar_events.createIndex({ start_time: 1 });

db.workflows.createIndex({ workspace_id: 1 });
db.workflows.createIndex({ is_active: 1 });

// Seed demo data (optional - remove for production)
db.users.insertMany([
    {
        name: 'Alice Chen',
        email: 'alice@rtnm.digital',
        password: '$2a$10$DemoHashedPassword123456789', // Pre-hashed demo123
        status: 'offline',
        last_seen: new Date(),
        workspaces: [],
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: 'Bob Smith',
        email: 'bob@rtnm.digital',
        password: '$2a$10$DemoHashedPassword123456789',
        status: 'offline',
        last_seen: new Date(),
        workspaces: [],
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: 'Carol Davis',
        email: 'carol@rtnm.digital',
        password: '$2a$10$DemoHashedPassword123456789',
        status: 'offline',
        last_seen: new Date(),
        workspaces: [],
        created_at: new Date(),
        updated_at: new Date()
    }
]);

print('✅ REZ Workspace MongoDB initialized successfully');
print('📦 Collections created: users, workspaces, channels, messages, meetings, documents, tasks, projects, calendar_events, workflows');
print('🔍 Indexes created on all collections');
print('👥 Demo users seeded (alice, bob, carol)');