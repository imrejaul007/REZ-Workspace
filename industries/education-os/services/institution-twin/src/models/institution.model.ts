import { v4 as uuidv4 } from 'uuid';
import { InstitutionTwin } from '../schemas/institution.schema';

export class InstitutionModel {
  static createInstitution(data: {
    identity: InstitutionTwin['identity'];
    metadata: InstitutionTwin['metadata'];
  }): InstitutionTwin {
    const now = new Date().toISOString();

    return {
      twinId: `institution_${uuidv4()}`,
      merchantId: uuidv4(),
      createdAt: now,
      updatedAt: now,
      identity: {
        name: {
          legal: data.identity.name.legal,
          display: data.identity.name.display || data.identity.name.legal,
          acronym: data.identity.name.acronym || ''
        },
        type: data.identity.type,
        contact: data.identity.contact || {
          address: { street: '', city: '', state: '', zipCode: '', country: '' },
          phone: '',
          email: '',
          website: ''
        },
        accreditations: data.identity.accreditations || [],
        established: data.identity.established || ''
      },
      structure: {
        departments: [],
        programs: [],
        facilities: [],
        policies: []
      },
      people: {
        students: { total: 0, active: 0, byLevel: {} },
        staff: { total: 0, teachers: 0, admin: 0, support: 0 },
        leadership: { principal: '', heads: {} }
      },
      programs: {
        academic: [],
        vocational: [],
        corporate: [],
        online: []
      },
      performance: {
        studentOutcomes: { avgGPA: 0, passRate: 0, graduationRate: 0, placementRate: 0 },
        reputation: { brandPulseScore: 0, reviewsCount: 0, avgRating: 0, ranking: 0 },
        financial: { revenue: 0, expenses: 0, scholarships: 0, enrollmentRevenue: 0 }
      },
      integrations: {
        erp: null,
        lms: null,
        payment: null,
        communication: []
      },
      relationships: {
        partners: [],
        employers: [],
        vendors: [],
        alumni: []
      },
      financial: {
        walletBalance: 0,
        revenueShare: 0,
        pendingPayouts: 0
      },
      metadata: {
        createdAt: now,
        status: data.metadata.status || 'active',
        tier: data.metadata.tier || 'basic'
      }
    };
  }

  static updateInstitution(inst: InstitutionTwin, updates: Partial<InstitutionTwin>): InstitutionTwin {
    return {
      ...inst,
      ...updates,
      twinId: inst.twinId,
      merchantId: inst.merchantId,
      createdAt: inst.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  static addStudent(inst: InstitutionTwin): InstitutionTwin {
    return {
      ...inst,
      people: {
        ...inst.people,
        students: {
          ...inst.people.students,
          total: inst.people.students.total + 1,
          active: inst.people.students.active + 1
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addTeacher(inst: InstitutionTwin): InstitutionTwin {
    return {
      ...inst,
      people: {
        ...inst.people,
        staff: {
          ...inst.people.staff,
          total: inst.people.staff.total + 1,
          teachers: inst.people.staff.teachers + 1
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  static updatePerformance(inst: InstitutionTwin, perf: Partial<InstitutionTwin['performance']>): InstitutionTwin {
    return {
      ...inst,
      performance: {
        studentOutcomes: { ...inst.performance.studentOutcomes, ...perf.studentOutcomes },
        reputation: { ...inst.performance.reputation, ...perf.reputation },
        financial: { ...inst.performance.financial, ...perf.financial }
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addDepartment(inst: InstitutionTwin, dept: InstitutionTwin['structure']['departments'][0]): InstitutionTwin {
    return {
      ...inst,
      structure: {
        ...inst.structure,
        departments: [...inst.structure.departments, dept]
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addProgram(inst: InstitutionTwin, program: Program, category: 'academic' | 'vocational' | 'corporate' | 'online'): InstitutionTwin {
    return {
      ...inst,
      programs: {
        ...inst.programs,
        [category]: [...inst.programs[category], program]
      },
      updatedAt: new Date().toISOString()
    };
  }

  static setIntegration(inst: InstitutionTwin, integrationType: 'erp' | 'lms' | 'payment', url: string): InstitutionTwin {
    return {
      ...inst,
      integrations: {
        ...inst.integrations,
        [integrationType]: url
      },
      updatedAt: new Date().toISOString()
    };
  }
}