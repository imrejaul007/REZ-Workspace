import mongoose, { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { EmployeeStatus } from '../types/index.js';
// ============================================================================
// MONGOOSE SCHEMA
// ============================================================================
const EmployeeSchema = new Schema({
    id: { type: String, required: true, unique: true, default: uuid },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    role: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    avatar: { type: String },
    capabilities: { type: [String], default: [] },
    status: {
        type: String,
        enum: Object.values(EmployeeStatus),
        default: EmployeeStatus.OFFLINE
    },
    metadata: { type: Schema.Types.Mixed },
    skills: { type: [String], default: [] },
    languages: { type: [String], default: ['en'] },
    workingHours: {
        start: { type: String, match: /^\d{2}:\d{2}$/ },
        end: { type: String, match: /^\d{2}:\d{2}$/ },
        timezone: { type: String, default: 'Asia/Kolkata' }
    }
}, { timestamps: true });
// Compound indexes
EmployeeSchema.index({ tenantId: 1, status: 1 });
EmployeeSchema.index({ tenantId: 1, capabilities: 1 });
EmployeeSchema.index({ tenantId: 1, role: 1 });
let EmployeeModel;
try {
    EmployeeModel = mongoose.model('CommInterfaceEmployee');
}
catch {
    EmployeeModel = mongoose.model('CommInterfaceEmployee', EmployeeSchema);
}
class EmployeeRegistry {
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
        // Ensure indexes
        await EmployeeModel.ensureIndexes();
        this.initialized = true;
        console.log('[EmployeeRegistry] Initialized');
    }
    async register(data) {
        const employee = new EmployeeModel({
            ...data,
            id: uuid(),
            status: EmployeeStatus.OFFLINE
        });
        await employee.save();
        return employee.toObject();
    }
    async findById(id, tenantId) {
        return EmployeeModel.findOne({ id, tenantId }).lean();
    }
    async findByRole(tenantId, role) {
        return EmployeeModel.find({ tenantId, role }).lean();
    }
    async findByCapability(tenantId, capability) {
        return EmployeeModel.find({
            tenantId,
            capabilities: { $in: [capability] }
        }).lean();
    }
    async findByStatus(tenantId, status) {
        return EmployeeModel.find({ tenantId, status }).lean();
    }
    async findAvailable(tenantId) {
        return EmployeeModel.find({
            tenantId,
            status: { $in: [EmployeeStatus.ONLINE, EmployeeStatus.AVAILABLE] }
        }).lean();
    }
    async listByTenant(tenantId) {
        return EmployeeModel.find({ tenantId }).lean();
    }
    async update(id, tenantId, updates) {
        const employee = await EmployeeModel.findOneAndUpdate({ id, tenantId }, { $set: updates }, { new: true }).lean();
        return employee;
    }
    async updateStatus(id, tenantId, status) {
        return this.update(id, tenantId, { status });
    }
    async delete(id, tenantId) {
        const result = await EmployeeModel.deleteOne({ id, tenantId });
        return result.deletedCount > 0;
    }
    async countByTenant(tenantId) {
        return EmployeeModel.countDocuments({ tenantId });
    }
    async countByStatus(tenantId) {
        const results = await EmployeeModel.aggregate([
            { $match: { tenantId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const counts = {
            [EmployeeStatus.ONLINE]: 0,
            [EmployeeStatus.OFFLINE]: 0,
            [EmployeeStatus.BUSY]: 0,
            [EmployeeStatus.AWAY]: 0
        };
        for (const result of results) {
            counts[result._id] = result.count;
        }
        return counts;
    }
    /**
     * Find the best available employee based on skills and availability
     */
    async findBestMatch(tenantId, requiredSkills, preferredRole) {
        const query = {
            tenantId,
            status: { $in: [EmployeeStatus.ONLINE, EmployeeStatus.AVAILABLE] }
        };
        if (preferredRole) {
            query.role = preferredRole;
        }
        if (requiredSkills.length > 0) {
            query.capabilities = { $all: requiredSkills };
        }
        // Sort by number of matching skills (descending) and availability
        const employees = await EmployeeModel.aggregate([
            { $match: query },
            {
                $addFields: {
                    skillMatchCount: {
                        $size: {
                            $setIntersection: ['$capabilities', requiredSkills]
                        }
                    }
                }
            },
            { $sort: { skillMatchCount: -1, updatedAt: 1 } },
            { $limit: 1 }
        ]);
        return employees.length > 0 ? employees[0] : null;
    }
}
export const employeeRegistry = new EmployeeRegistry();
//# sourceMappingURL=employeeRegistry.js.map