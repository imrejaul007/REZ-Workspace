import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// In-memory stores
const teams: Map<string, any> = new Map();
const members: Map<string, any> = new Map();

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'team-service', timestamp: new Date().toISOString() });
});

// Get all teams
app.get('/api/teams', (_req: Request, res: Response) => {
  const teamList = Array.from(teams.values());
  res.json({ success: true, count: teamList.length, data: teamList });
});

// Create a team
app.post('/api/teams', (req: Request, res: Response) => {
  const { name, description, department, leadId } = req.body;

  if (!name) {
    res.status(400).json({ success: false, error: 'Team name is required' });
    return;
  }

  const team = {
    id: uuidv4(),
    name,
    description: description || '',
    department: department || 'general',
    leadId: leadId || null,
    memberIds: [],
    createdAt: new Date().toISOString()
  };

  teams.set(team.id, team);
  res.status(201).json({ success: true, data: team });
});

// Get team by ID
app.get('/api/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const team = teams.get(id);

  if (!team) {
    res.status(404).json({ success: false, error: 'Team not found' });
    return;
  }

  // Include member details
  const memberDetails = team.memberIds.map((mid: string) => members.get(mid)).filter(Boolean);
  res.json({ success: true, data: { ...team, members: memberDetails } });
});

// Update team
app.put('/api/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const team = teams.get(id);

  if (!team) {
    res.status(404).json({ success: false, error: 'Team not found' });
    return;
  }

  const { name, description, department, leadId } = req.body;
  const updated = {
    ...team,
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(department && { department }),
    ...(leadId !== undefined && { leadId }),
    updatedAt: new Date().toISOString()
  };

  teams.set(id, updated);
  res.json({ success: true, data: updated });
});

// Add member to team
app.post('/api/teams/:id/members', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, role } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, error: 'userId is required' });
    return;
  }

  const team = teams.get(id);
  if (!team) {
    res.status(404).json({ success: false, error: 'Team not found' });
    return;
  }

  if (!team.memberIds.includes(userId)) {
    team.memberIds.push(userId);
    teams.set(id, team);

    // Create member record if not exists
    if (!members.has(userId)) {
      members.set(userId, {
        id: userId,
        name: `User ${userId}`,
        role: role || 'member',
        teamId: id,
        joinedAt: new Date().toISOString()
      });
    }
  }

  res.json({ success: true, data: team });
});

// Remove member from team
app.delete('/api/teams/:id/members/:userId', (req: Request, res: Response) => {
  const { id, userId } = req.params;
  const team = teams.get(id);

  if (!team) {
    res.status(404).json({ success: false, error: 'Team not found' });
    return;
  }

  team.memberIds = team.memberIds.filter((mid: string) => mid !== userId);
  teams.set(id, team);

  res.json({ success: true, message: 'Member removed from team' });
});

// Delete team
app.delete('/api/teams/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = teams.delete(id);

  if (deleted) {
    res.json({ success: true, message: 'Team deleted' });
  } else {
    res.status(404).json({ success: false, error: 'Team not found' });
  }
});

// Get team statistics
app.get('/api/teams/:id/stats', (req: Request, res: Response) => {
  const { id } = req.params;
  const team = teams.get(id);

  if (!team) {
    res.status(404).json({ success: false, error: 'Team not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      teamId: id,
      teamName: team.name,
      totalMembers: team.memberIds.length,
      hasLead: !!team.leadId,
      department: team.department,
      createdAt: team.createdAt
    }
  });
});

app.listen(PORT, () => {
  console.log(`Team Service running on port ${PORT}`);
});

export default app;