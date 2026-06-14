'use client';

// ==========================================
// PeopleOS - Manager Intelligence Dashboard
// Team Health, Burnout Alerts, Attrition Risk
// ==========================================

import React, { useState } from 'react';
import { mockTeamHealth, mockBurnoutAlerts, mockAttritionRisks } from '@/services/mockData';

// ==========================================
// Types
// ==========================================

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  riskScore: number;
  riskFactors: string[];
}

interface PromotionCandidate {
  id: string;
  name: string;
  currentRole: string;
  targetRole: string;
  readinessScore: number;
  keyStrengths: string[];
}

interface SkillGapAnalysis {
  skill: string;
  demandLevel: number;
  supplyLevel: number;
  gapSize: number;
  teamMembersWithSkill: string[];
  recommendedAction: string;
}

interface BurnoutAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  riskFactors: string[];
  recommendations: string[];
  lastUpdated: string;
}

interface AttritionRisk {
  id: string;
  employeeId: string;
  employeeName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  tenure: string;
  flightRiskFactors: string[];
  retentionActions: string[];
  lastUpdated: string;
}

// ==========================================
// Utility Functions
// ==========================================

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return 'var(--error)';
    case 'high': return 'var(--warning)';
    case 'medium': return '#f59e0b';
    case 'low': return 'var(--success)';
    default: return 'var(--gray-500)';
  }
}

function getRiskBgColor(level: string): string {
  switch (level) {
    case 'critical': return 'rgba(239, 68, 68, 0.1)';
    case 'high': return 'rgba(245, 158, 11, 0.1)';
    case 'medium': return 'rgba(245, 158, 11, 0.1)';
    case 'low': return 'rgba(16, 185, 129, 0.1)';
    default: return 'var(--gray-100)';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ==========================================
// Components
// ==========================================

function MetricCard({ title, value, subtitle, color, trend }: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card" style={{ flex: 1, minWidth: '200px' }}>
      <div style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '8px' }}>{title}</div>
      <div style={{
        fontSize: '32px',
        fontWeight: '700',
        color: color || 'var(--gray-800)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {value}
        {trend && (
          <span style={{
            fontSize: '14px',
            color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--gray-500)'
          }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      {subtitle && <div style={{ color: 'var(--gray-500)', fontSize: '12px', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

function RiskBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? 'var(--error)' : score >= 40 ? 'var(--warning)' : 'var(--success)';
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--gray-600)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color }}>{score}%</span>
      </div>
      <div style={{ height: '8px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );
}

function BurnoutAlertCard({ alert }: { alert: BurnoutAlert }) {
  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${getRiskColor(alert.riskLevel)}`,
        background: getRiskBgColor(alert.riskLevel)
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{alert.employeeName}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Risk Score: <span style={{ fontWeight: '600', color: getRiskColor(alert.riskLevel) }}>{alert.riskScore}</span>
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          background: getRiskBgColor(alert.riskLevel),
          color: getRiskColor(alert.riskLevel),
          textTransform: 'uppercase'
        }}>
          {alert.riskLevel}
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '6px' }}>Risk Factors:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {alert.riskFactors.map((factor, i) => (
            <span key={i} style={{
              padding: '4px 10px',
              background: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--gray-700)'
            }}>
              {factor}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '6px' }}>Recommendations:</div>
        {alert.recommendations.map((rec, i) => (
          <div key={i} style={{ fontSize: '13px', color: 'var(--gray-700)', marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <span style={{ color: 'var(--primary)' }}>→</span>
            {rec}
          </div>
        ))}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--gray-400)', textAlign: 'right' }}>
        Updated: {formatDate(alert.lastUpdated)}
      </div>
    </div>
  );
}

function AttritionRiskCard({ risk }: { risk: AttritionRisk }) {
  return (
    <div
      className="card"
      style={{
        borderLeft: `4px solid ${getRiskColor(risk.riskLevel)}`,
        background: getRiskBgColor(risk.riskLevel)
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>{risk.employeeName}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Tenure: {risk.tenure} • Score: <span style={{ fontWeight: '600', color: getRiskColor(risk.riskLevel) }}>{risk.riskScore}</span>
          </div>
        </div>
        <span style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          background: getRiskBgColor(risk.riskLevel),
          color: getRiskColor(risk.riskLevel),
          textTransform: 'uppercase'
        }}>
          {risk.riskLevel} Risk
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '6px' }}>Flight Risk Factors:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {risk.flightRiskFactors.map((factor, i) => (
            <span key={i} style={{
              padding: '4px 10px',
              background: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--gray-700)'
            }}>
              {factor}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '6px' }}>Retention Actions:</div>
        {risk.retentionActions.map((action, i) => (
          <div key={i} style={{ fontSize: '13px', color: 'var(--gray-700)', marginBottom: '4px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <span style={{ color: 'var(--success)' }}>✓</span>
            {action}
          </div>
        ))}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--gray-400)', textAlign: 'right' }}>
        Updated: {formatDate(risk.lastUpdated)}
      </div>
    </div>
  );
}

function PromotionCandidateCard({ candidate }: { candidate: PromotionCandidate }) {
  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '16px'
        }}>
          {candidate.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>{candidate.name}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            {candidate.currentRole} → <span style={{ color: 'var(--primary)' }}>{candidate.targetRole}</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>{candidate.readinessScore}%</div>
          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Ready</div>
        </div>
      </div>

      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '6px' }}>Key Strengths:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {candidate.keyStrengths.map((strength, i) => (
            <span key={i} style={{
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--success)'
            }}>
              {strength}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillGapCard({ gap }: { gap: any }) {
  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{gap.skill}</div>
          <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
            Gap: <span style={{ fontWeight: '600', color: 'var(--error)' }}>{gap.gapSize}%</span>
          </div>
        </div>
        <div style={{
          padding: '4px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--error)'
        }}>
          High Demand
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Demand</span>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>{gap.demandLevel}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${gap.demandLevel}%`, height: '100%', background: 'var(--error)', borderRadius: '3px' }} />
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Supply</span>
          <span style={{ fontSize: '12px', fontWeight: '600' }}>{gap.supplyLevel}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--gray-200)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${gap.supplyLevel}%`, height: '100%', background: 'var(--success)', borderRadius: '3px' }} />
        </div>
      </div>

      <div style={{ padding: '10px', background: 'var(--gray-100)', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '4px' }}>Team Members:</div>
        <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>{gap.teamMembersWithSkill.join(', ')}</div>
      </div>

      <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--success)', marginBottom: '4px' }}>Recommendation:</div>
        <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>{gap.recommendedAction}</div>
      </div>
    </div>
  );
}

function TeamMemberCard({ member, type }: { member: TeamMember; type: 'overloaded' | 'underperforming' }) {
  return (
    <div className="card" style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--gray-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '13px'
          }}>
            {member.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div style={{ fontWeight: '500', fontSize: '14px' }}>{member.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{member.designation}</div>
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          background: type === 'overloaded' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: type === 'overloaded' ? 'var(--warning)' : 'var(--error)'
        }}>
          Risk: {member.riskScore}
        </div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--gray-600)' }}>
        {member.riskFactors.join(' • ')}
      </div>
    </div>
  );
}

// ==========================================
// Main Page Component
// ==========================================

export default function ManagerIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'burnout' | 'attrition' | 'promotions' | 'skills'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'burnout', label: 'Burnout Alerts', icon: '🔥', count: mockBurnoutAlerts.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length },
    { id: 'attrition', label: 'Attrition Risk', icon: '⚠️', count: mockAttritionRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length },
    { id: 'promotions', label: 'Promotion Ready', icon: '⭐' },
    { id: 'skills', label: 'Skill Gaps', icon: '📚' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Manager Intelligence
        </h1>
        <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
          AI-powered insights for team health, burnout prevention, and talent development
        </p>
      </div>

      {/* Team Summary Card */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
              {mockTeamHealth.teamName}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8 }}>
              Manager: {mockTeamHealth.managerName} • {mockTeamHealth.memberCount} members
            </div>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            Last Updated: Today
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: mockTeamHealth.burnoutRisk >= 50 ? 'var(--warning)' : 'var(--success)' }}>
              {mockTeamHealth.burnoutRisk}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Burnout Risk</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: mockTeamHealth.attritionRisk >= 50 ? 'var(--error)' : 'var(--success)' }}>
              {mockTeamHealth.attritionRisk}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Attrition Risk</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--success)' }}>
              {mockTeamHealth.moraleScore}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Team Morale</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary)' }}>
              {mockTeamHealth.avgProductivity}%
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Productivity</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--gray-200)',
        paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              background: activeTab === tab.id ? 'var(--primary)' : 'var(--gray-100)',
              color: activeTab === tab.id ? 'white' : 'var(--gray-600)',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--error)',
                color: activeTab === tab.id ? 'white' : 'white'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metrics */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <MetricCard
              title="High Risk Alerts"
              value={mockBurnoutAlerts.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length}
              subtitle="Need immediate attention"
              color="var(--error)"
            />
            <MetricCard
              title="Attrition Risks"
              value={mockAttritionRisks.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length}
              subtitle="Flight risk employees"
              color="var(--warning)"
            />
            <MetricCard
              title="Promotion Ready"
              value={mockTeamHealth.promotionReady.length}
              subtitle="Ready for next level"
              color="var(--success)"
            />
            <MetricCard
              title="Skill Gaps"
              value={mockTeamHealth.skillGaps.length}
              subtitle="Critical gaps identified"
              color="var(--secondary)"
            />
          </div>

          {/* Risk Distribution */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Risk Distribution</h3>
            <RiskBar score={mockTeamHealth.burnoutRisk} label="Team Burnout Risk" />
            <RiskBar score={mockTeamHealth.attritionRisk} label="Team Attrition Risk" />
            <RiskBar score={mockTeamHealth.moraleScore} label="Team Morale Score" />
            <RiskBar score={mockTeamHealth.avgProductivity} label="Average Productivity" />
          </div>

          {/* Overloaded & Underperforming */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '12px', color: 'var(--warning)' }}>Overloaded Members 🔥</h3>
              {mockTeamHealth.overloadedMembers.map(member => (
                <TeamMemberCard key={member.id} member={member} type="overloaded" />
              ))}
            </div>
            <div>
              <h3 style={{ marginBottom: '12px', color: 'var(--error)' }}>Needs Support 📋</h3>
              {mockTeamHealth.underperforming.map(member => (
                <TeamMemberCard key={member.id} member={member} type="underperforming" />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'burnout' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2>Burnout Alerts</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
              Employees showing signs of burnout requiring immediate attention
            </p>
          </div>
          {mockBurnoutAlerts.map(alert => (
            <BurnoutAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {activeTab === 'attrition' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2>Attrition Risk Analysis</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
              Employees at risk of leaving with recommended retention actions
            </p>
          </div>
          {mockAttritionRisks.map(risk => (
            <AttritionRiskCard key={risk.id} risk={risk} />
          ))}
        </div>
      )}

      {activeTab === 'promotions' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2>Promotion Candidates</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
              Team members ready for their next career level
            </p>
          </div>
          {mockTeamHealth.promotionReady.map(candidate => (
            <PromotionCandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}

      {activeTab === 'skills' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2>Skill Gap Analysis</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
              Identified skill gaps with recommendations for team development
            </p>
          </div>
          {mockTeamHealth.skillGaps.map((gap, i) => (
            <SkillGapCard key={i} gap={gap} />
          ))}
        </div>
      )}
    </div>
  );
}
