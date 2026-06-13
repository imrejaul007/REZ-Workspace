/**
 * RTMN Education OS - Complete Education Platform
 * Connects: CorpID, MemoryOS, KnowledgeGraphOS, TwinOS, SimulationOS, Business Copilot, BOA, SUTAR
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5060;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
const coursesRouter = require('./routes/courses');
const studentsRouter = require('./routes/students');
const teachersRouter = require('./routes/teachers');
const institutionsRouter = require('./routes/institutions');
const enrollmentsRouter = require('./routes/enrollments');
const assignmentsRouter = require('./routes/assignments');
const gradesRouter = require('./routes/grades');
const analyticsRouter = require('./routes/analytics');
const twinsRouter = require('./routes/twins');
const agentsRouter = require('./routes/agents');

app.use('/api/courses', coursesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/institutions', institutionsRouter);
app.use('/api/enrollments', enrollmentsRouter);
app.use('/api/assignments', assignmentsRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/twins', twinsRouter);
app.use('/api/agents', agentsRouter);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'Education OS', version: '1.0.0', port: PORT }));
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Education OS',
    description: 'Education Platform with Digital Twins',
    version: '1.0.0',
    industry: 'Education',
    digitalTwins: ['Course Twin', 'Student Twin', 'Teacher Twin', 'Institution Twin'],
    aiAgents: ['Tutor Agent', 'Admin Agent', 'Analytics Agent'],
    routes: ['/api/courses', '/api/students', '/api/teachers', '/api/institutions', '/api/enrollments', '/api/assignments', '/api/grades', '/api/twins', '/api/agents']
  });
});

app.listen(PORT, () => console.log(`🎓 RTMN Education OS running on port ${PORT}`));
module.exports = app;
