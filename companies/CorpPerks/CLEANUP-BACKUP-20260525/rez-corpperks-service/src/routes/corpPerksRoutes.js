/**
 * CorpPerks Routes
 * Benefits, Employees, HRIS - Using MongoDB
 *
 * Uses RABTUL Auth for authentication
 */

const express = require('express');
const router = express.Router();

// Models
const Benefit = require('../models/benefit');
const Employee = require('../models/employee');

// RABTUL Configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

if (!INTERNAL_TOKEN) {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required');
}

// Verify token with RABTUL Auth Service
async function verifyTokenWithRABTUL(token) {
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.success && data.user) {
      return {
        sub: data.user.id,
        phone: data.user.phone,
        email: data.user.email,
        role: data.user.role || 'user',
        companyId: data.user.companyId,
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] RABTUL verify failed:', error);
    return null;
  }
}

// Auth middleware - VERIFIES tokens via RABTUL
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization header required' });
  }

  const token = authHeader.substring(7);
  const user = await verifyTokenWithRABTUL(token);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  req.user = user;
  next();
};

// Internal auth - verifies internal tokens
const requireInternal = (req, res, next) => {
  const token = req.headers['x-internal-token'];

  if (token !== INTERNAL_TOKEN) {
    return res.status(403).json({ success: false, message: 'Internal access required' });
  }
  next();
};

// ============ BENEFITS ============

// GET /api/corp/benefits
router.get('/benefits', requireAuth, async (req, res) => {
  try {
    const { status, type, companyId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (companyId) filter.companyId = companyId;

    const benefits = await Benefit.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: benefits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/corp/benefits
router.post('/benefits', requireAuth, async (req, res) => {
  try {
    const { name, type, amount, frequency, description, companyId, department, eligibility, rules } = req.body;

    if (!name || !type || !amount) {
      return res.status(400).json({ success: false, message: 'name, type, and amount are required' });
    }

    const count = await Benefit.countDocuments();
    const benefit = new Benefit({
      benefitId: `B${String(count + 1).padStart(4, '0')}`,
      name,
      type,
      amount,
      frequency: frequency || 'monthly',
      description,
      companyId,
      department,
      eligibility,
      rules,
      status: 'active',
    });

    await benefit.save();
    res.status(201).json({ success: true, data: benefit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/corp/benefits/:id
router.get('/benefits/:id', requireAuth, async (req, res) => {
  try {
    const benefit = await Benefit.findOne({ benefitId: req.params.id });
    if (!benefit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: benefit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/corp/benefits/:id
router.put('/benefits/:id', requireAuth, async (req, res) => {
  try {
    const benefit = await Benefit.findOneAndUpdate(
      { benefitId: req.params.id },
      { $set: { ...req.body, updatedAt: new Date() } },
      { new: true }
    );
    if (!benefit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: benefit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/corp/benefits/:id
router.delete('/benefits/:id', requireAuth, async (req, res) => {
  try {
    const benefit = await Benefit.findOneAndUpdate(
      { benefitId: req.params.id },
      { $set: { status: 'inactive', updatedAt: new Date() } },
      { new: true }
    );
    if (!benefit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Benefit deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ EMPLOYEES ============

// GET /api/corp/employees
router.get('/employees', requireAuth, async (req, res) => {
  try {
    const { status, department, companyId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (companyId) filter.companyId = companyId;

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/corp/employees
router.post('/employees', requireAuth, async (req, res) => {
  try {
    const { name, email, phone, department, level, companyId } = req.body;

    if (!name || !email || !companyId) {
      return res.status(400).json({ success: false, message: 'name, email, and companyId are required' });
    }

    const count = await Employee.countDocuments({ companyId });
    const employee = new Employee({
      userId: req.user.id,
      companyId,
      employeeId: `EMP${String(count + 1).padStart(4, '0')}`,
      name,
      email,
      phone,
      department,
      level,
      status: 'pending',
      benefits: [],
    });

    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/corp/employees/:id
router.get('/employees/:id', requireAuth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.id });
    if (!employee) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/corp/employees/:id/benefits
router.post('/employees/:id/benefits', requireAuth, async (req, res) => {
  try {
    const { benefitIds } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId: req.params.id },
      {
        $set: {
          benefits: benefitIds,
          status: 'active',
          updatedAt: new Date(),
        }
      },
      { new: true }
    );

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ MY PROFILE ============

// GET /api/corp/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    let employee = await Employee.findOne({ email: user.email });
    if (!employee) {
      employee = await Employee.findOne({ userId: user.id });
    }

    res.json({
      success: true,
      data: {
        id: employee?.employeeId || user.id,
        employeeId: employee?.employeeId || 'N/A',
        name: employee?.name || user.name || 'Unknown',
        email: user.email,
        department: employee?.department || 'N/A',
        level: employee?.level || 'N/A',
        company: employee?.companyId || 'N/A',
        companyId: employee?.companyId || user.companyId || 'N/A',
        status: employee?.status || 'N/A',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/corp/me/benefits
router.get('/me/benefits', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    let employee = await Employee.findOne({ email: user.email });
    if (!employee) {
      employee = await Employee.findOne({ userId: user.id });
    }

    if (!employee || !employee.benefits?.length) {
      return res.json({ success: true, data: [] });
    }

    const benefits = await Benefit.find({ benefitId: { $in: employee.benefits } });
    res.json({ success: true, data: benefits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/corp/me/usage
router.get('/me/usage', requireAuth, async (req, res) => {
  try {
    const user = req.user;

    let employee = await Employee.findOne({ email: user.email });
    if (!employee) {
      employee = await Employee.findOne({ userId: user.id });
    }

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const benefits = await Benefit.find({ benefitId: { $in: employee.benefits || [] } });

    const usage = {};
    benefits.forEach(b => {
      usage[b.type] = {
        allocated: b.amount,
        used: 0,
        remaining: b.amount,
      };
    });

    res.json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
