'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Plus, Trash2, Settings2, ChevronDown,
  ChevronRight, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';

interface Field {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options?: string[];
}

interface Condition {
  id: string;
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
}

interface LogicRule {
  id: string;
  conditions: Condition[];
  conditionType: 'and' | 'or';
  action: 'show' | 'hide' | 'require';
  targetFieldId: string;
}

interface ConditionalLogicEditorProps {
  fields: Field[];
  rules: LogicRule[];
  onUpdate: (rules: LogicRule[]) => void;
}

const OPERATORS = [
  { value: 'equals', label: 'equals', types: ['short_text', 'email', 'phone', 'number', 'dropdown', 'multiple_choice', 'yes_no'] },
  { value: 'not_equals', label: 'does not equal', types: ['short_text', 'email', 'phone', 'number', 'dropdown', 'multiple_choice', 'yes_no'] },
  { value: 'contains', label: 'contains', types: ['short_text', 'long_text', 'email'] },
  { value: 'not_contains', label: 'does not contain', types: ['short_text', 'long_text', 'email'] },
  { value: 'greater_than', label: 'is greater than', types: ['number', 'rating', 'scale'] },
  { value: 'less_than', label: 'is less than', types: ['number', 'rating', 'scale'] },
  { value: 'is_empty', label: 'is empty', types: ['short_text', 'long_text', 'email', 'phone', 'number'] },
  { value: 'is_not_empty', label: 'is not empty', types: ['short_text', 'long_text', 'email', 'phone', 'number'] },
];

export function ConditionalLogicEditor({ fields, rules, onUpdate }: ConditionalLogicEditorProps) {
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const addRule = () => {
    const newRule: LogicRule = {
      id: `rule_${Date.now()}`,
      conditions: [{
        id: `cond_${Date.now()}`,
        fieldId: fields[0]?.id || '',
        operator: 'equals',
        value: '',
      }],
      conditionType: 'and',
      action: 'show',
      targetFieldId: fields[1]?.id || '',
    };
    onUpdate([...rules, newRule]);
    setExpandedRule(newRule.id);
  };

  const updateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    onUpdate(rules.map(r => r.id === ruleId ? { ...r, ...updates } : r));
  };

  const deleteRule = (ruleId: string) => {
    onUpdate(rules.filter(r => r.id !== ruleId));
    setExpandedRule(null);
  };

  const addCondition = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      fieldId: fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };

    updateRule(ruleId, { conditions: [...rule.conditions, newCondition] });
  };

  const updateCondition = (ruleId: string, conditionId: string, updates: Partial<Condition>) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const updatedConditions = rule.conditions.map(c =>
      c.id === conditionId ? { ...c, ...updates } : c
    );
    updateRule(ruleId, { conditions: updatedConditions });
  };

  const deleteCondition = (ruleId: string, conditionId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule || rule.conditions.length <= 1) return;

    updateRule(ruleId, {
      conditions: rule.conditions.filter(c => c.id !== conditionId),
    });
  };

  const getField = (fieldId: string) => fields.find(f => f.id === fieldId);

  const getOperatorsForField = (fieldId: string) => {
    const field = getField(fieldId);
    if (!field) return OPERATORS;
    return OPERATORS.filter(op => op.types.includes(field.type));
  };

  const getFieldOptions = (fieldId: string) => {
    const field = getField(fieldId);
    if (!field?.options) return [];
    return field.options;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Conditional Logic
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Show, hide, or require fields based on answers
          </p>
        </div>
        <button
          onClick={addRule}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Rules List */}
      <AnimatePresence>
        {rules.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center"
          >
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="font-medium text-gray-700 mb-2">No conditional logic yet</h4>
            <p className="text-sm text-gray-500 mb-4">
              Add rules to show, hide, or require fields based on other answers
            </p>
            <button
              onClick={addRule}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Create your first rule
            </button>
          </motion.div>
        ) : (
          rules.map((rule) => {
            const isExpanded = expandedRule === rule.id;
            const targetField = getField(rule.targetFieldId);
            const hasOptions = getFieldOptions(rule.targetFieldId).length > 0;

            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Rule Header */}
                <button
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    rule.action === 'show' ? 'bg-green-100 text-green-600' :
                    rule.action === 'hide' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {rule.action === 'show' ? <Eye className="w-4 h-4" /> :
                     rule.action === 'hide' ? <EyeOff className="w-4 h-4" /> :
                     <AlertCircle className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {rule.action === 'show' ? 'Show' : rule.action === 'hide' ? 'Hide' : 'Require'}{' '}
                      <span className="text-purple-600">"{targetField?.question?.substring(0, 30) || 'field'}"</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {rule.conditions.length} condition{rule.conditions.length > 1 ? 's' : ''} ({rule.conditionType.toUpperCase()})
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
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="border-t border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 space-y-4 bg-gray-50">
                        {/* Action Selection */}
                        <div className="grid grid-cols-3 gap-2">
                          {(['show', 'hide', 'require'] as const).map((action) => (
                            <button
                              key={action}
                              onClick={() => updateRule(rule.id, { action })}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                rule.action === action
                                  ? action === 'show' ? 'bg-green-500 text-white' :
                                    action === 'hide' ? 'bg-red-500 text-white' :
                                    'bg-yellow-500 text-white'
                                  : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              {action.charAt(0).toUpperCase() + action.slice(1)}
                            </button>
                          ))}
                        </div>

                        {/* Target Field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            When this field:
                          </label>
                          <select
                            value={rule.targetFieldId}
                            onChange={(e) => updateRule(rule.id, { targetFieldId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          >
                            {fields.map((field) => (
                              <option key={field.id} value={field.id}>
                                {field.question.substring(0, 50)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Conditions */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              If these conditions are met:
                            </label>
                            <div className="flex items-center gap-2">
                              <select
                                value={rule.conditionType}
                                onChange={(e) => updateRule(rule.id, { conditionType: e.target.value as 'and' | 'or' })}
                                className="px-2 py-1 border border-gray-200 rounded text-sm"
                              >
                                <option value="and">AND</option>
                                <option value="or">OR</option>
                              </select>
                              <button
                                onClick={() => addCondition(rule.id)}
                                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {rule.conditions.map((condition, index) => {
                            const operators = getOperatorsForField(condition.fieldId);
                            const options = getFieldOptions(condition.fieldId);
                            const showValueInput = !['is_empty', 'is_not_empty'].includes(condition.operator);

                            return (
                              <div key={condition.id} className="flex items-start gap-2 bg-white p-3 rounded-lg border border-gray-200">
                                {/* Field */}
                                <select
                                  value={condition.fieldId}
                                  onChange={(e) => updateCondition(rule.id, condition.id, { fieldId: e.target.value, value: '' })}
                                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                >
                                  {fields.map((field) => (
                                    <option key={field.id} value={field.id}>
                                      {field.question.substring(0, 30)}
                                    </option>
                                  ))}
                                </select>

                                {/* Operator */}
                                <select
                                  value={condition.operator}
                                  onChange={(e) => updateCondition(rule.id, condition.id, { operator: e.target.value as Condition['operator'] })}
                                  className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                >
                                  {operators.map((op) => (
                                    <option key={op.value} value={op.value}>
                                      {op.label}
                                    </option>
                                  ))}
                                </select>

                                {/* Value */}
                                {showValueInput && (
                                  options.length > 0 ? (
                                    <select
                                      value={condition.value}
                                      onChange={(e) => updateCondition(rule.id, condition.id, { value: e.target.value })}
                                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                    >
                                      <option value="">Select...</option>
                                      {options.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={condition.value}
                                      onChange={(e) => updateCondition(rule.id, condition.id, { value: e.target.value })}
                                      placeholder="Value"
                                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                    />
                                  )
                                )}

                                {/* Delete */}
                                <button
                                  onClick={() => deleteCondition(rule.id, condition.id)}
                                  disabled={rule.conditions.length <= 1}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </AnimatePresence>
    </div>
  );
}