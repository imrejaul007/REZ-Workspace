/**
 * Store Agent - ShopFlow AI
 * Manages store operations, staff scheduling, and retail environment
 */

import axios from 'axios';

// Types
export interface Store {
  storeId: string;
  name: string;
  code: string;
  type: 'flagship' | 'regular' | 'outlet' | 'pop_up' | 'franchise';
  status: 'active' | 'inactive' | 'opening' | 'closing';
  address: Address;
  contact: { phone: string; email: string; manager: string };
  hours: StoreHours;
  departments: string[];
  totalArea: number;
  sellingArea: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: { lat: number; lng: number };
}

export interface StoreHours {
  regular: DayHours[];
  holiday: { date: Date; hours: DayHours }[];
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Staff {
  staffId: string;
  storeId: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'manager' | 'assistant_manager' | 'supervisor' | 'cashier' | 'sales_associate' | 'stock_clerk';
  department: string;
  status: 'active' | 'on_leave' | 'terminated';
  hireDate: Date;
  schedule: WeeklySchedule;
  skills: string[];
  certifications: string[];
}

export interface WeeklySchedule {
  weekStart: Date;
  shifts: Shift[];
}

export interface Shift {
  shiftId: string;
  staffId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  role: string;
  department?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  breaks: { start: string; end: string }[];
}

export interface StoreMetrics {
  storeId: string;
  period: { start: Date; end: Date };
  sales: { revenue: number; transactions: number; avgTransaction: number; units: number };
  traffic: { visitors: number; conversionRate: number; avgDwellTime: number };
  inventory: { stockLevel: number; stockTurnover: number; shrinkage: number };
  staff: { headcount: number; productivity: number; turnover: number };
  customerSatisfaction: { score: number; responses: number; nps: number };
}

export interface StoreTask {
  taskId: string;
  storeId: string;
  type: 'cleaning' | 'restocking' | 'merchandising' | 'inventory' | 'maintenance' | 'training';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  assignedTo?: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  location?: string;
  category?: string;
}

export interface StoreAlert {
  alertId: string;
  storeId: string;
  type: 'stock' | 'safety' | 'maintenance' | 'compliance' | 'customer' | 'security';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  action?: string;
}

export interface StoreEnvironment {
  storeId: string;
  metrics: EnvironmentMetrics;
  controls: EnvironmentControls;
  lastUpdated: Date;
}

export interface EnvironmentMetrics {
  temperature: number;
  humidity: number;
  airQuality: number;
  noiseLevel: number;
  lightingLevel: number;
}

export interface EnvironmentControls {
  hvac: { mode: 'auto' | 'cooling' | 'heating'; targetTemp: number };
  lighting: { mode: 'auto' | 'manual'; brightness: number };
  music: { playing: boolean; volume: number; playlist?: string };
}

export interface StaffingPlan {
  storeId: string;
  weekStart: Date;
  forecasts: StaffingForecast[];
  shifts: Shift[];
  coverage: CoverageAnalysis;
}

export interface StaffingForecast {
  date: Date;
  day: string;
  expectedTraffic: number;
  expectedSales: number;
  requiredStaff: number;
  departments: { name: string; required: number }[];
}

export interface CoverageAnalysis {
  totalHoursNeeded: number;
  totalHoursScheduled: number;
  coveragePercent: number;
  gaps: { date: string; time: string; department: string; shortfall: number }[];
  overstaffed: { date: string; time: string; department: string; excess: number }[];
}

export class StoreAgent {
  private shopflowBaseUrl: string;

  constructor() {
    this.shopflowBaseUrl = process.env.SHOPFLOW_BASE_URL || 'http://localhost:4830';
  }

  /**
   * Create a new store
   */
  async createStore(storeData: Partial<Store>): Promise<Store> {
    const storeId = `STORE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    return {
      storeId,
      name: storeData.name || 'New Store',
      code: `STR-${storeId}`,
      type: storeData.type || 'regular',
      status: 'opening',
      address: storeData.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
      },
      contact: storeData.contact || {
        phone: '',
        email: '',
        manager: ''
      },
      hours: storeData.hours || {
        regular: [
          { open: '09:00', close: '21:00', closed: false },
          { open: '09:00', close: '21:00', closed: false },
          { open: '09:00', close: '21:00', closed: false },
          { open: '09:00', close: '21:00', closed: false },
          { open: '09:00', close: '22:00', closed: false },
          { open: '10:00', close: '22:00', closed: false },
          { open: '10:00', close: '20:00', closed: false }
        ],
        holiday: []
      },
      departments: storeData.departments || ['Grocery', 'Electronics', 'Apparel', 'Home'],
      totalArea: storeData.totalArea || 5000,
      sellingArea: storeData.sellingArea || 4000,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get store metrics
   */
  async getStoreMetrics(
    storeId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<StoreMetrics> {
    const start = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = dateRange?.end || new Date();

    return {
      storeId,
      period: { start, end },
      sales: {
        revenue: 2500000,
        transactions: 15000,
        avgTransaction: 166.67,
        units: 45000
      },
      traffic: {
        visitors: 50000,
        conversionRate: 30,
        avgDwellTime: 25
      },
      inventory: {
        stockLevel: 85,
        stockTurnover: 12,
        shrinkage: 1.5
      },
      staff: {
        headcount: 50,
        productivity: 50000,
        turnover: 15
      },
      customerSatisfaction: {
        score: 4.3,
        responses: 500,
        nps: 45
      }
    };
  }

  /**
   * Create staff member
   */
  async createStaff(storeId: string, staffData: Partial<Staff>): Promise<Staff> {
    const staffId = `STAFF-${Date.now()}`;

    return {
      staffId,
      storeId,
      employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
      name: staffData.name || '',
      email: staffData.email || '',
      phone: staffData.phone || '',
      role: staffData.role || 'sales_associate',
      department: staffData.department || 'General',
      status: 'active',
      hireDate: new Date(),
      schedule: { weekStart: new Date(), shifts: [] },
      skills: staffData.skills || [],
      certifications: staffData.certifications || []
    };
  }

  /**
   * Schedule a shift
   */
  async scheduleShift(
    staffId: string,
    date: Date,
    startTime: string,
    endTime: string,
    role: string,
    department?: string
  ): Promise<Shift> {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    return {
      shiftId: `SHIFT-${Date.now()}`,
      staffId,
      date,
      startTime,
      endTime,
      duration,
      role,
      department,
      status: 'scheduled',
      breaks: [{ start: '13:00', end: '13:30' }]
    };
  }

  /**
   * Generate staffing forecast
   */
  async forecastStaffing(
    storeId: string,
    weekStart: Date
  ): Promise<StaffingForecast[]> {
    const forecasts: StaffingForecast[] = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const isWeekend = i === 0 || i === 6;

      forecasts.push({
        date,
        day: days[i],
        expectedTraffic: isWeekend ? 5000 : 3000,
        expectedSales: isWeekend ? 500000 : 250000,
        requiredStaff: isWeekend ? 30 : 20,
        departments: [
          { name: 'Checkout', required: isWeekend ? 8 : 5 },
          { name: 'Floor', required: isWeekend ? 15 : 10 },
          { name: 'Stock', required: isWeekend ? 7 : 5 }
        ]
      });
    }

    return forecasts;
  }

  /**
   * Generate optimal schedule
   */
  async generateSchedule(
    storeId: string,
    weekStart: Date,
    constraints?: {
      maxHoursPerWeek?: number;
      minRestBetweenShifts?: number;
      staffPreferences?: Record<string, string[]>;
    }
  ): Promise<StaffingPlan> {
    const forecasts = await this.forecastStaffing(storeId, weekStart);
    const shifts: Shift[] = [];
    const staff = await this.getStoreStaff(storeId);

    // Generate shifts based on forecast
    for (const forecast of forecasts) {
      let hourCounter = 9;
      for (const dept of forecast.departments) {
        for (let i = 0; i < Math.ceil(dept.required / 3); i++) {
          const staffMember = staff[i % staff.length];
          if (staffMember) {
            shifts.push({
              shiftId: `SHIFT-${Date.now()}-${Math.random()}`,
              staffId: staffMember.staffId,
              date: forecast.date,
              startTime: `${String(hourCounter).padStart(2, '0')}:00`,
              endTime: `${String(hourCounter + 8).padStart(2, '0')}:00`,
              duration: 8,
              role: staffMember.role,
              department: dept.name,
              status: 'scheduled',
              breaks: [{ start: '13:00', end: '13:30' }]
            });
          }
        }
      }
    }

    const totalHoursNeeded = forecasts.reduce((sum, f) =>
      sum + f.departments.reduce((s, d) => s + d.required * 8, 0), 0);

    return {
      storeId,
      weekStart,
      forecasts,
      shifts,
      coverage: {
        totalHoursNeeded,
        totalHoursScheduled: shifts.reduce((sum, s) => sum + s.duration, 0),
        coveragePercent: 95,
        gaps: [],
        overstaffed: []
      }
    };
  }

  /**
   * Get store staff
   */
  async getStoreStaff(storeId: string): Promise<Staff[]> {
    try {
      const { data } = await axios.get(`${this.shopflowBaseUrl}/api/stores/${storeId}/staff`);
      return data;
    } catch {
      return [];
    }
  }

  /**
   * Create store task
   */
  async createTask(storeId: string, taskData: Partial<StoreTask>): Promise<StoreTask> {
    return {
      taskId: `TASK-${Date.now()}`,
      storeId,
      type: taskData.type || 'cleaning',
      priority: taskData.priority || 'medium',
      title: taskData.title || '',
      description: taskData.description || '',
      dueDate: taskData.dueDate || new Date(),
      status: 'pending'
    };
  }

  /**
   * Get store alerts
   */
  async getAlerts(storeId: string, severity?: StoreAlert['severity']): Promise<StoreAlert[]> {
    const alerts: StoreAlert[] = [
      {
        alertId: 'ALERT-1',
        storeId,
        type: 'stock',
        severity: 'warning',
        title: 'Low Stock Alert',
        message: 'Product ABC is running low (5 units remaining)',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        alertId: 'ALERT-2',
        storeId,
        type: 'maintenance',
        severity: 'info',
        title: 'Scheduled Maintenance',
        message: 'HVAC filter replacement due in 5 days',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    return severity ? alerts.filter(a => a.severity === severity) : alerts;
  }

  /**
   * Control store environment
   */
  async setEnvironment(
    storeId: string,
    controls: Partial<EnvironmentControls>
  ): Promise<StoreEnvironment> {
    return {
      storeId,
      metrics: {
        temperature: 22,
        humidity: 55,
        airQuality: 85,
        noiseLevel: 65,
        lightingLevel: 800
      },
      controls: {
        hvac: controls.hvac || { mode: 'auto', targetTemp: 22 },
        lighting: controls.lighting || { mode: 'auto', brightness: 100 },
        music: controls.music || { playing: true, volume: 50 }
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Compare store performance
   */
  async compareStores(
    storeIds: string[],
    metrics: ('sales' | 'traffic' | 'inventory' | 'staff' | 'satisfaction')[]
  ): Promise<{
    stores: { storeId: string; metrics: Record<string, number> }[];
    rankings: { metric: string; rankings: { storeId: string; value: number; rank: number }[] }[];
  }> {
    const storeData = storeIds.map(id => ({
      storeId: id,
      metrics: {
        sales: Math.random() * 1000000,
        traffic: Math.random() * 10000,
        inventory: Math.random() * 100,
        staff: Math.random() * 100,
        satisfaction: Math.random() * 5
      }
    }));

    return {
      stores: storeData,
      rankings: metrics.map(metric => ({
        metric,
        rankings: storeData
          .map(s => ({ storeId: s.storeId, value: s.metrics[metric] }))
          .sort((a, b) => b.value - a.value)
          .map((s, i) => ({ ...s, rank: i + 1 }))
      }))
    };
  }
}

export const storeAgent = new StoreAgent();