import { v4 as uuidv4 } from 'uuid';
import { Store, Department, StoreCapacity, OperatingHours, DayHours } from '../schemas/store.schema';

export class StoreModel {
  static createStore(data: {
    storeCode: string;
    name: string;
    type: 'flagship' | 'regular' | ' outlet' | 'warehouse';
    address: any;
    coordinates?: { latitude: number; longitude: number };
    contact?: any;
    capacity?: { maxCustomers?: number; checkoutCount?: number };
    amenities?: string[];
  }): Store {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      storeCode: data.storeCode,
      name: data.name,
      type: data.type,
      address: data.address,
      coordinates: data.coordinates || { latitude: 0, longitude: 0 },
      operatingHours: this.createDefaultOperatingHours(),
      contact: data.contact || {
        phone: '',
        email: '',
        managerName: '',
        managerEmail: '',
      },
      status: 'active',
      departments: [],
      staff: {
        totalCount: 0,
        byRole: {},
        schedule: this.createDefaultSchedule(),
      },
      capacity: this.createDefaultCapacity(data.capacity),
      amenities: data.amenities || [],
      createdAt: now,
      updatedAt: now,
    };
  }

  static createDefaultOperatingHours(): OperatingHours {
    const defaultDay: DayHours = { open: '09:00', close: '21:00', closed: false };
    return {
      monday: { ...defaultDay },
      tuesday: { ...defaultDay },
      wednesday: { ...defaultDay },
      thursday: { ...defaultDay },
      friday: { ...defaultDay },
      saturday: { open: '10:00', close: '22:00', closed: false },
      sunday: { open: '11:00', close: '19:00', closed: false },
    };
  }

  static createDefaultSchedule() {
    return {
      monday: 5,
      tuesday: 5,
      wednesday: 5,
      thursday: 5,
      friday: 6,
      saturday: 7,
      sunday: 4,
    };
  }

  static createDefaultCapacity(custom?: { maxCustomers?: number; checkoutCount?: number }): StoreCapacity {
    return {
      maxCustomers: custom?.maxCustomers || 200,
      currentCustomers: 0,
      checkoutCount: custom?.checkoutCount || 10,
      activeCheckouts: 0,
    };
  }

  static updateStore(store: Store, updates: Partial<Store>): Store {
    return {
      ...store,
      ...updates,
      id: store.id,
      storeCode: updates.storeCode || store.storeCode,
      updatedAt: new Date().toISOString(),
    };
  }

  static addDepartment(store: Store, department: Omit<Department, 'id' | 'metrics'>): Store {
    const newDepartment: Department = {
      id: uuidv4(),
      ...department,
      metrics: {
        dailySales: 0,
        weeklySales: 0,
        monthlySales: 0,
        transactionCount: 0,
        averageBasketSize: 0,
        staffCount: department.categories.length,
      },
    };

    return {
      ...store,
      departments: [...store.departments, newDepartment],
      updatedAt: new Date().toISOString(),
    };
  }

  static updateDepartmentMetrics(store: Store, departmentId: string, salesDelta: number): Store {
    const departments = store.departments.map(dept => {
      if (dept.id === departmentId) {
        return {
          ...dept,
          metrics: {
            ...dept.metrics,
            dailySales: dept.metrics.dailySales + salesDelta,
            weeklySales: dept.metrics.weeklySales + salesDelta,
            monthlySales: dept.metrics.monthlySales + salesDelta,
            transactionCount: dept.metrics.transactionCount + 1,
          },
        };
      }
      return dept;
    });

    return {
      ...store,
      departments,
      updatedAt: new Date().toISOString(),
    };
  }

  static updateCustomerCount(store: Store, count: number): Store {
    return {
      ...store,
      capacity: {
        ...store.capacity,
        currentCustomers: Math.max(0, Math.min(count, store.capacity.maxCustomers)),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static updateActiveCheckouts(store: Store, count: number): Store {
    return {
      ...store,
      capacity: {
        ...store.capacity,
        activeCheckouts: Math.max(0, Math.min(count, store.capacity.checkoutCount)),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static updateStaffCount(store: Store, role: string, count: number): Store {
    const newByRole = { ...store.staff.byRole, [role]: count };
    const totalCount = Object.values(newByRole).reduce((sum, c) => sum + c, 0);

    return {
      ...store,
      staff: {
        ...store.staff,
        totalCount,
        byRole: newByRole,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static closeStore(store: Store, temporary: boolean = true): Store {
    return {
      ...store,
      status: temporary ? 'temporarily_closed' : 'permanently_closed',
      updatedAt: new Date().toISOString(),
    };
  }

  static reopenStore(store: Store): Store {
    return {
      ...store,
      status: 'active',
      updatedAt: new Date().toISOString(),
    };
  }

  static isStoreOpen(store: Store, date?: Date): Date {
    const checkDate = date || new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[checkDate.getDay()];
    const dayHours = store.operatingHours[dayName as keyof OperatingHours] as DayHours;

    if (dayHours.closed) {
      return new Date(0);
    }

    const [openHour, openMin] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = dayHours.close.split(':').map(Number);

    const openTime = new Date(checkDate);
    openTime.setHours(openHour, openMin, 0, 0);

    const closeTime = new Date(checkDate);
    closeTime.setHours(closeHour, closeMin, 0, 0);

    const now = checkDate.getTime();
    if (now < openTime.getTime()) {
      return openTime;
    }
    if (now >= closeTime.getTime()) {
      return new Date(0);
    }
    return closeTime;
  }

  static calculateOccupancy(store: Store): number {
    return (store.capacity.currentCustomers / store.capacity.maxCustomers) * 100;
  }

  static getStoreMetrics(store: Store): {
    occupancyRate: number;
    checkoutUtilization: number;
    totalDepartments: number;
    totalStaff: number;
    averageTransactionValue: number;
    isOpen: boolean;
  } {
    const occupancyRate = this.calculateOccupancy(store);
    const checkoutUtilization = store.capacity.checkoutCount > 0
      ? (store.capacity.activeCheckouts / store.capacity.checkoutCount) * 100
      : 0;

    let totalSales = 0;
    let totalTransactions = 0;
    store.departments.forEach(dept => {
      totalSales += dept.metrics.monthlySales;
      totalTransactions += dept.metrics.transactionCount;
    });

    return {
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      checkoutUtilization: Math.round(checkoutUtilization * 100) / 100,
      totalDepartments: store.departments.length,
      totalStaff: store.staff.totalCount,
      averageTransactionValue: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      isOpen: store.status === 'active' && this.isStoreOpen(store).getTime() > Date.now(),
    };
  }
}
