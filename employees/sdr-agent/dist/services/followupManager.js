"use strict";
// ============================================
// HOJAI AI - SDR Agent Follow-up Manager Service
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.followupManager = exports.FollowupManager = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class FollowupManager {
    config;
    constructor(config) {
        this.config = {
            sequences: config?.sequences || this.getDefaultSequences(),
            defaultSequence: config?.defaultSequence || 'default-nurture',
            maxFollowups: config?.maxFollowups || 5,
            timezone: config?.timezone || 'America/New_York',
            businessHours: config?.businessHours || { start: 9, end: 17 }
        };
    }
    /**
     * Schedule follow-ups for a lead
     */
    async scheduleFollowups(tenantId, leadId, followups, ownerId) {
        logger_1.logger.info('Scheduling follow-ups', { tenantId, leadId, count: followups.length });
        // Validate lead exists
        const lead = await models_1.Lead.findOne({ _id: leadId, tenantId });
        if (!lead) {
            return {
                success: false,
                followups: [],
                error: 'Lead not found'
            };
        }
        // Check max followups
        const existingCount = await models_1.Followup.countDocuments({
            tenantId,
            leadId: lead._id,
            status: { $ne: types_1.FollowupStatus.SKIPPED }
        });
        if (existingCount + followups.length > this.config.maxFollowups) {
            return {
                success: false,
                followups: [],
                error: `Maximum followups (${this.config.maxFollowups}) would be exceeded`
            };
        }
        // Create followup records
        const createdFollowups = [];
        const now = new Date();
        for (const followup of followups) {
            const scheduledDate = new Date(followup.scheduledAt);
            // Only schedule future followups
            if (scheduledDate <= now) {
                continue;
            }
            const followupDoc = await models_1.Followup.create({
                tenantId,
                leadId: lead._id,
                channel: followup.channel,
                status: types_1.FollowupStatus.SCHEDULED,
                scheduledFor: scheduledDate,
                message: followup.message,
                metadata: {
                    reminder: followup.reminder !== false,
                    createdBy: ownerId
                }
            });
            createdFollowups.push(this.mapToIFollowup(followupDoc));
        }
        // Update lead's next followup
        if (createdFollowups.length > 0) {
            const nextFollowup = createdFollowups.reduce((earliest, f) => {
                const fDate = new Date(f.scheduledFor);
                const eDate = new Date(earliest.scheduledFor);
                return fDate < eDate ? f : earliest;
            });
            await models_1.Lead.findByIdAndUpdate(lead._id, {
                nextFollowupAt: new Date(nextFollowup.scheduledFor)
            });
            // Log activity
            await models_1.Activity.create({
                tenantId,
                leadId: lead._id,
                type: 'followup',
                description: `Scheduled ${createdFollowups.length} follow-up(s)`,
                metadata: {
                    followupIds: createdFollowups.map(f => f.id),
                    channels: createdFollowups.map(f => f.channel)
                },
                createdBy: ownerId || 'system'
            });
        }
        logger_1.logger.info(`Scheduled ${createdFollowups.length} follow-ups`, { tenantId, leadId });
        return {
            success: true,
            followups: createdFollowups
        };
    }
    /**
     * Schedule follow-ups using a predefined sequence
     */
    async scheduleSequence(tenantId, leadId, sequenceId, startDate, ownerId) {
        const sequence = this.config.sequences.find(s => s.id === (sequenceId || this.config.defaultSequence));
        if (!sequence) {
            throw new Error(`Sequence ${sequenceId || this.config.defaultSequence} not found`);
        }
        const start = startDate ? new Date(startDate) : new Date();
        const followups = [];
        let currentDate = new Date(start);
        for (const step of sequence.steps) {
            // Calculate delay
            currentDate.setDate(currentDate.getDate() + step.delayDays);
            if (step.delayHours) {
                currentDate.setHours(currentDate.getHours() + step.delayHours);
            }
            // Skip if conditions met
            if (step.skipIf) {
                const lead = await models_1.Lead.findOne({ _id: leadId, tenantId });
                const latestOutreach = await models_1.Outreach.findOne({ tenantId, leadId: lead?._id })
                    .sort({ createdAt: -1 });
                if (step.skipIf.replied && latestOutreach?.repliedAt) {
                    continue;
                }
                if (step.skipIf.opened && latestOutreach?.openedAt) {
                    continue;
                }
                if (step.skipIf.clicked && latestOutreach?.clickedAt) {
                    continue;
                }
            }
            followups.push({
                channel: step.channel,
                scheduledAt: currentDate.toISOString(),
                message: step.message,
                reminder: true
            });
        }
        const result = await this.scheduleFollowups(tenantId, leadId, followups, ownerId);
        return {
            success: result.success,
            followups: result.followups,
            sequence: sequence.id
        };
    }
    /**
     * Get pending followups for a tenant
     */
    async getPendingFollowups(tenantId, options) {
        const query = {
            tenantId,
            status: types_1.FollowupStatus.SCHEDULED,
            scheduledFor: {}
        };
        if (options?.channel) {
            query.channel = options.channel;
        }
        if (options?.before) {
            query.scheduledFor.$lte = options.before;
        }
        if (options?.after) {
            query.scheduledFor.$gte = options.after;
        }
        else {
            query.scheduledFor.$lte = new Date();
        }
        const total = await models_1.Followup.countDocuments(query);
        const followups = await models_1.Followup.find(query)
            .sort({ scheduledFor: 1 })
            .skip(options?.offset || 0)
            .limit(options?.limit || 50)
            .populate('leadId');
        // Enrich with contact info
        const enrichedFollowups = await Promise.all(followups.map(async (f) => {
            const lead = f.leadId;
            const contact = await models_1.Contact.findById(lead.contactId);
            return {
                ...this.mapToIFollowup(f),
                contact: contact ? {
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    email: contact.email,
                    phone: contact.phone
                } : { firstName: 'Unknown' }
            };
        }));
        return { followups: enrichedFollowups, total };
    }
    /**
     * Mark followup as completed
     */
    async completeFollowup(tenantId, followupId, options, completedBy) {
        const followup = await models_1.Followup.findOne({ _id: followupId, tenantId });
        if (!followup) {
            return null;
        }
        if (options?.skipped) {
            followup.status = types_1.FollowupStatus.SKIPPED;
            followup.skippedReason = options.skipReason;
            followup.completedAt = new Date();
        }
        else {
            followup.status = types_1.FollowupStatus.COMPLETED;
            followup.sentAt = new Date();
            followup.completedAt = new Date();
            if (options?.outreachId) {
                followup.outreachId = new (require('mongoose').Types.ObjectId)(options.outreachId);
            }
        }
        await followup.save();
        // Log activity
        await models_1.Activity.create({
            tenantId,
            leadId: followup.leadId,
            type: options?.skipped ? 'followup' : 'followup',
            description: options?.skipped
                ? `Follow-up skipped: ${options.skipReason}`
                : 'Follow-up completed',
            metadata: { followupId: followup._id },
            createdBy: completedBy || 'system'
        });
        // Update lead's next followup
        const nextFollowup = await models_1.Followup.findOne({
            tenantId,
            leadId: followup.leadId,
            status: types_1.FollowupStatus.SCHEDULED,
            _id: { $ne: followup._id }
        }).sort({ scheduledFor: 1 });
        await models_1.Lead.findByIdAndUpdate(followup.leadId, {
            nextFollowupAt: nextFollowup ? nextFollowup.scheduledFor : null
        });
        return this.mapToIFollowup(followup);
    }
    /**
     * Reschedule a followup
     */
    async rescheduleFollowup(tenantId, followupId, newScheduledAt, rescheduledBy) {
        const followup = await models_1.Followup.findOne({ _id: followupId, tenantId });
        if (!followup) {
            return null;
        }
        const oldDate = followup.scheduledFor;
        followup.scheduledFor = new Date(newScheduledAt);
        followup.status = types_1.FollowupStatus.SCHEDULED;
        await followup.save();
        // Log activity
        await models_1.Activity.create({
            tenantId,
            leadId: followup.leadId,
            type: 'followup',
            description: `Follow-up rescheduled from ${oldDate} to ${newScheduledAt}`,
            metadata: { followupId: followup._id, oldDate, newDate: newScheduledAt },
            createdBy: rescheduledBy || 'system'
        });
        // Update lead's next followup
        const nextFollowup = await models_1.Followup.findOne({
            tenantId,
            leadId: followup.leadId,
            status: types_1.FollowupStatus.SCHEDULED,
            _id: { $ne: followup._id }
        }).sort({ scheduledFor: 1 });
        await models_1.Lead.findByIdAndUpdate(followup.leadId, {
            nextFollowupAt: nextFollowup ? nextFollowup.scheduledFor : null
        });
        return this.mapToIFollowup(followup);
    }
    /**
     * Cancel all pending followups for a lead
     */
    async cancelFollowups(tenantId, leadId, reason, cancelledBy) {
        const result = await models_1.Followup.updateMany({ tenantId, leadId, status: types_1.FollowupStatus.SCHEDULED }, {
            $set: {
                status: types_1.FollowupStatus.SKIPPED,
                skippedReason: reason || 'Cancelled manually',
                completedAt: new Date()
            }
        });
        // Clear lead's next followup
        await models_1.Lead.findByIdAndUpdate(leadId, { nextFollowupAt: null });
        // Log activity
        await models_1.Activity.create({
            tenantId,
            leadId,
            type: 'followup',
            description: `Cancelled ${result.modifiedCount} follow-up(s): ${reason || 'No reason provided'}`,
            metadata: { cancelledCount: result.modifiedCount },
            createdBy: cancelledBy || 'system'
        });
        return result.modifiedCount;
    }
    /**
     * Get followup statistics
     */
    async getFollowupStats(tenantId, dateRange) {
        const matchStage = { tenantId };
        if (dateRange) {
            matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
        }
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalScheduled: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', types_1.FollowupStatus.COMPLETED] }, 1, 0] }
                    },
                    skipped: {
                        $sum: { $cond: [{ $eq: ['$status', types_1.FollowupStatus.SKIPPED] }, 1, 0] }
                    },
                    byChannel: { $push: '$channel' }
                }
            }
        ];
        const result = await models_1.Followup.aggregate(pipeline);
        if (result.length === 0) {
            return {
                totalScheduled: 0,
                totalCompleted: 0,
                totalSkipped: 0,
                completionRate: 0,
                avgTimeToComplete: 0,
                byChannel: this.getEmptyChannelStats()
            };
        }
        const stats = result[0];
        const byChannel = {};
        // Count by channel
        for (const channel of Object.values(types_1.OutreachChannel)) {
            byChannel[channel] = { completed: 0, skipped: 0, pending: 0 };
        }
        const followups = await models_1.Followup.find(matchStage);
        for (const f of followups) {
            const ch = f.channel;
            if (!byChannel[ch])
                byChannel[ch] = { completed: 0, skipped: 0, pending: 0 };
            if (f.status === types_1.FollowupStatus.COMPLETED)
                byChannel[ch].completed++;
            else if (f.status === types_1.FollowupStatus.SKIPPED)
                byChannel[ch].skipped++;
            else
                byChannel[ch].pending++;
        }
        // Calculate avg time to complete
        const completedFollowups = await models_1.Followup.find({
            ...matchStage,
            status: types_1.FollowupStatus.COMPLETED,
            completedAt: { $exists: true }
        });
        let avgTime = 0;
        if (completedFollowups.length > 0) {
            const totalMs = completedFollowups.reduce((sum, f) => {
                const ms = (f.completedAt.getTime() - f.scheduledFor.getTime());
                return sum + ms;
            }, 0);
            avgTime = totalMs / completedFollowups.length / (1000 * 60 * 60); // Hours
        }
        return {
            totalScheduled: stats.totalScheduled,
            totalCompleted: stats.completed,
            totalSkipped: stats.skipped,
            completionRate: stats.totalScheduled > 0
                ? Math.round((stats.completed / stats.totalScheduled) * 100)
                : 0,
            avgTimeToComplete: Math.round(avgTime * 10) / 10,
            byChannel: byChannel
        };
    }
    /**
     * Get default followup sequences
     */
    getDefaultSequences() {
        return [
            {
                id: 'default-nurture',
                name: 'Default Nurture Sequence',
                isActive: true,
                steps: [
                    {
                        order: 1,
                        channel: types_1.OutreachChannel.EMAIL,
                        delayDays: 1,
                        message: 'Hi {{firstName}}, just wanted to follow up on my previous message. Would love to connect!',
                        skipIf: { replied: true }
                    },
                    {
                        order: 2,
                        channel: types_1.OutreachChannel.LINKEDIN,
                        delayDays: 2,
                        message: 'Hi {{firstName}}, connected with you on LinkedIn. Would appreciate connecting!',
                        skipIf: { replied: true }
                    },
                    {
                        order: 3,
                        channel: types_1.OutreachChannel.EMAIL,
                        delayDays: 3,
                        message: 'Hi {{firstName}}, following up again. Happy to share a case study if helpful.',
                        skipIf: { replied: true }
                    },
                    {
                        order: 4,
                        channel: types_1.OutreachChannel.EMAIL,
                        delayDays: 5,
                        message: 'Hi {{firstName}}, I\'ll pause here but feel free to reach out if things change!',
                        skipIf: { replied: true }
                    }
                ]
            },
            {
                id: 'hot-lead-fast',
                name: 'Hot Lead Fast Track',
                isActive: true,
                steps: [
                    {
                        order: 1,
                        channel: types_1.OutreachChannel.EMAIL,
                        delayDays: 0,
                        delayHours: 2,
                        message: 'Hi {{firstName}}, thanks for your interest! Let\'s schedule a quick call.',
                        skipIf: { replied: true }
                    },
                    {
                        order: 2,
                        channel: types_1.OutreachChannel.PHONE,
                        delayDays: 1,
                        message: 'Calling to follow up on your inquiry.',
                        skipIf: { replied: true }
                    },
                    {
                        order: 3,
                        channel: types_1.OutreachChannel.EMAIL,
                        delayDays: 2,
                        message: 'Hi {{firstName}}, just checking in. Still interested in connecting?',
                        skipIf: { replied: true }
                    }
                ]
            }
        ];
    }
    /**
     * Get empty channel stats
     */
    getEmptyChannelStats() {
        const stats = {};
        for (const channel of Object.values(types_1.OutreachChannel)) {
            stats[channel] = { completed: 0, skipped: 0, pending: 0 };
        }
        return stats;
    }
    /**
     * Map MongoDB document to IFollowup
     */
    mapToIFollowup(doc) {
        return {
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            leadId: doc.leadId.toString(),
            outreachId: doc.outreachId?.toString(),
            channel: doc.channel,
            status: doc.status,
            scheduledFor: doc.scheduledFor,
            message: doc.message,
            sentAt: doc.sentAt,
            completedAt: doc.completedAt,
            skippedReason: doc.skippedReason,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    }
}
exports.FollowupManager = FollowupManager;
exports.followupManager = new FollowupManager();
//# sourceMappingURL=followupManager.js.map