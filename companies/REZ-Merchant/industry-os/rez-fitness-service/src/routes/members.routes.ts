import { Router, Request, Response } from 'express';
import { memberService } from '../services/MemberService';
import { z } from 'zod';

const router = Router();

const CreateMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  membershipId: z.string().optional(),
  notes: z.string().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  goals: z.array(z.string()).optional()
});

const UpdateMemberSchema = CreateMemberSchema.partial();

// Create member
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateMemberSchema.parse(req.body);
    const member = await memberService.createMember(data);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create member' });
    }
  }
});

// Get all members
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await memberService.getAllMembers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      status: status as string,
      search: search as string
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
});

// Get member by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const member = await memberService.getMemberById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch member' });
  }
});

// Update member
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = UpdateMemberSchema.parse(req.body);
    const member = await memberService.updateMember(req.params.id, data);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update member' });
    }
  }
});

// Update member status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'suspended', 'expired'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const member = await memberService.updateMemberStatus(req.params.id, status);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update member status' });
  }
});

// Delete member
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await memberService.deleteMember(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete member' });
  }
});

// Assign membership to member
router.post('/:id/membership', async (req: Request, res: Response) => {
  try {
    const { membershipId, durationDays } = req.body;
    const membership = await memberService.assignMembership(
      req.params.id,
      membershipId,
      durationDays || 30
    );
    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign membership' });
  }
});

// Get member's active membership
router.get('/:id/membership', async (req: Request, res: Response) => {
  try {
    const membership = await memberService.getMemberMembership(req.params.id);
    res.json({ success: true, data: membership });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch membership' });
  }
});

// Get member attendance
router.get('/:id/attendance', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const attendance = await memberService.getMemberAttendance(req.params.id);
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
});

// Get member billing history
router.get('/:id/billing', async (req: Request, res: Response) => {
  try {
    const billing = await memberService.getMemberBillingHistory(req.params.id);
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch billing history' });
  }
});

export default router;
