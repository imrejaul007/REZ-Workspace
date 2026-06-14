'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Plus, Trash2, ArrowRight, ArrowDown, Settings2, Eye, EyeOff } from 'lucide-react';

interface Field {
  id: string;
  type: string;
  question: string;
  options?: string[];
}

interface SkipRule {
  id: string;
  sourceFieldId: string;
  condition: {
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: string;
  };
  targetFieldId: string;
  enabled: boolean;
}

interface SkipLogicEditorProps {
  fields: Field[];
  skipRules: SkipRule[];
  onUpdate: (skipRules: SkipRule[]) => void;
}

const CONDITION_LABELS: Record<string, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  greater_than: 'is greater than',
  less_than: 'is less than',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

export function SkipLogicEditor({ fields, skipRules, onUpdate }: SkipLogicEditorProps) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showVisual, setShowVisual] = useState(true);

  const getField = (fieldId: string) => fields.find(f => f.id === fieldId);
  const getFieldOptions = (fieldId: string) => getField(fieldId)?.options || [];

  const addRule = () => {
    const newRule: SkipRule = {
      id: `skip_${Date.now()}`,
      sourceFieldId: fields[0]?.id || '',
      condition: {
        operator: 'equals',
        value: '',
      },
      targetFieldId: fields[1]?.id || '',
      enabled: true,
    };
    onUpdate([...skipRules, newRule]);
    setExpandedRule(newRule.id);
  };

  const updateRule = (ruleId: string, updates: Partial<SkipRule>) => {
    onUpdate(skipRules.map(r => r.id === ruleId ? { ...r, ...updates } : r));
  };

  const deleteRule = (ruleId: string) => {
    onUpdate(skipRules.filter(r => r.id !== ruleId));
    setExpandedRule(null);
  };

  const getFieldTypeForCondition = (fieldId: string) => {
    const field = getField(fieldId);
    if (!field) return [];

    switch (field.type) {
      case 'multiple_choice':
      case 'dropdown':
      case 'yes_no':
        return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
      case 'rating':
      case 'scale':
      case 'number':
        return ['equals', 'not_equals', 'greater_than', 'less_than', 'is_empty', 'is_not_empty'];
      case 'short_text':
      case 'long_text':
      case 'email':
        return ['equals', 'not_equals', 'contains', 'is_empty', 'is_not_empty'];
      default:
        return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
    }
  };

  // Build visual flow data
  const buildFlow = () => {
    const flow: { fieldId: string; connections: { to: string; condition: string }[] }[] = [];

    fields.forEach((field, index) => {
      const connections: { to: string; condition: string }[] = [];
      const rules = skipRules.filter(r => r.sourceFieldId === field.id && r.enabled);

      if (rules.length > 0) {
        rules.forEach(rule => {
          const targetField = getField(rule.targetFieldId);
          const targetIndex = fields.findIndex(f => f.id === rule.targetFieldId);

          if (targetIndex !== index + 1) {
            connections.push({
              to: rule.targetFieldId,
              condition: `${CONDITION_LABELS[rule.condition.operator]} "${rule.condition.value || '...'}"`,
            });
          }
        });
      }

      flow.push({ fieldId: field.id, connections });
    });

    return flow;
  };

  const flow = buildFlow();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Skip Logic
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Skip to specific questions based on answers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVisual(!showVisual)}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              showVisual ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {showVisual ? 'Visual' : 'List'}
          </button>
          <button
            onClick={addRule}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Add Skip Rule
          </button>
        </div>
      </div>

      {/* Visual Flow */}
      {showVisual && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {fields.map((field, index) => {
              const fieldFlow = flow[index];
              const hasSkip = fieldFlow.connections.length > 0;
              const skippedBy = skipRules.filter(r => r.targetFieldId === field.id);
              const isSkipped = skippedBy.length > 0;

              return (
                <div key={field.id} className="flex items-start gap-4">
                  {/* Node */}
                  <div className={`flex-shrink-0 ${isSkipped ? 'opacity-50' : ''}`}>
                    <div className={`w-48 bg-white rounded-xl shadow-md border-2 ${
                      hasSkip ? 'border-purple-400' : 'border-gray-200'
                    }`}>
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-xs text-gray-400">Q{index + 1}</p>
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {field.question.substring(0, 40)}{field.question.length > 40 ? '...' : ''}
                        </p>
                      </div>
                      {hasSkip && (
                        <div className="p-2 bg-purple-50 text-purple-700 text-xs">
                          <ArrowDown className="w-3 h-3 inline mr-1" />
                          {fieldFlow.connections.length} skip{fieldFlow.connections.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Skip indicator */}
                    {hasSkip && (
                      <div className="mt-2 ml-4">
                        {fieldFlow.connections.map((conn, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-purple-600">
                            <div className="w-16 h-px bg-purple-300" />
                            <span className="truncate max-w-[80px]">{conn.condition}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  {index < fields.length - 1 && (
                    <div className={`flex items-center pt-8 ${isSkipped ? 'opacity-30' : ''}`}>
                      <div className="w-8 h-px bg-gray-300" />
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <div className="w-8 h-px bg-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-purple-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 rounded border-2 border-gray-300" />
              Normal flow
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-3 h-3 rounded border-2 border-purple-400" />
              Has skip logic
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 rounded bg-gray-200 opacity-50" />
              Skipped over
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      {!showVisual && (
        <div className="space-y-4">
          {skipRules.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-medium text-gray-700 mb-2">No skip logic rules yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Skip logic lets you jump to specific questions based on answers
              </p>
              <button
                onClick={addRule}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                Create your first skip rule
              </button>
            </div>
          ) : (
            skipRules.map((rule) => {
              const isExpanded = expandedRule === rule.id;
              const sourceField = getField(rule.sourceFieldId);
              const targetField = getField(rule.targetFieldId);
              const operators = getFieldTypeForCondition(rule.sourceFieldId);
              const options = getFieldOptions(rule.sourceFieldId);

              return (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-xl overflow-hidden ${
                    rule.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'
                  }`}
                >
                  {/* Rule Header */}
                  <button
                    onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateRule(rule.id, { enabled: !rule.enabled });
                      }}
                      className={`p-2 rounded-lg ${
                        rule.enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {rule.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          "{sourceField?.question.substring(0, 25) || '...'}"
                        </p>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <p className="font-medium text-purple-600">
                          "{targetField?.question.substring(0, 25) || '...'}"
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        When <span className="font-medium">{CONDITION_LABELS[rule.condition.operator]}</span>{' '}
                        {rule.condition.value && `"${rule.condition.value}"`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRule(rule.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>

                  {/* Expanded Editor */}
                  {isExpanded && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-4 gap-4">
                      {/* Source Field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          If field
                        </label>
                        <select
                          value={rule.sourceFieldId}
                          onChange={(e) => updateRule(rule.id, {
                            sourceFieldId: e.target.value,
                            condition: { operator: 'equals', value: '' }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          {fields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.question.substring(0, 30)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Operator */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Condition
                        </label>
                        <select
                          value={rule.condition.operator}
                          onChange={(e) => updateRule(rule.id, {
                            condition: { ...rule.condition, operator: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          {operators.map((op) => (
                            <option key={op} value={op}>
                              {CONDITION_LABELS[op]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Value
                        </label>
                        {options.length > 0 ? (
                          <select
                            value={rule.condition.value}
                            onChange={(e) => updateRule(rule.id, {
                              condition: { ...rule.condition, value: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          >
                            <option value="">Any</option>
                            {options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : !['is_empty', 'is_not_empty'].includes(rule.condition.operator) ? (
                          <input
                            type="text"
                            value={rule.condition.value}
                            onChange={(e) => updateRule(rule.id, {
                              condition: { ...rule.condition, value: e.target.value }
                            })}
                            placeholder="Value"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500">
                            No value needed
                          </div>
                        )}
                      </div>

                      {/* Target Field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Skip to
                        </label>
                        <select
                          value={rule.targetFieldId}
                          onChange={(e) => updateRule(rule.id, { targetFieldId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                        >
                          {fields.map((f, i) => {
                            const sourceIndex = fields.findIndex(ff => ff.id === rule.sourceFieldId);
                            const isAfter = i > sourceIndex;
                            return (
                              <option key={f.id} value={f.id} disabled={!isAfter && i !== sourceIndex + 1}>
                                {f.question.substring(0, 30)} {isAfter ? '(forward)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}