'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Plus, Trash2, Hash, Info, AlertCircle } from 'lucide-react';

interface Field {
  id: string;
  type: string;
  question: string;
  options?: string[];
}

interface Calculation {
  id: string;
  targetFieldId: string;
  expression: string;
  label: string;
}

interface CalculatedFieldsEditorProps {
  fields: Field[];
  calculations: Calculation[];
  onUpdate: (calculations: Calculation[]) => void;
}

const OPERATORS = [
  { symbol: '+', label: 'Add' },
  { symbol: '-', label: 'Subtract' },
  { symbol: '*', label: 'Multiply' },
  { symbol: '/', label: 'Divide' },
  { symbol: '%', label: 'Modulo' },
];

const FUNCTIONS = [
  { name: 'SUM', label: 'Sum', example: 'SUM(a, b, c)' },
  { name: 'AVG', label: 'Average', example: 'AVG(a, b, c)' },
  { name: 'MIN', label: 'Minimum', example: 'MIN(a, b)' },
  { name: 'MAX', label: 'Maximum', example: 'MAX(a, b)' },
  { name: 'ROUND', label: 'Round', example: 'ROUND(value, decimals)' },
  { name: 'IF', label: 'If/Else', example: 'IF(condition, true, false)' },
];

export function CalculatedFieldsEditor({ fields, calculations, onUpdate }: CalculatedFieldsEditorProps) {
  const [selectedCalc, setSelectedCalc] = useState<string | null>(null);
  const [insertingField, setInsertingField] = useState<string | null>(null);

  const numericFields = fields.filter(f =>
    ['number', 'rating', 'scale', 'calculation'].includes(f.type)
  );

  const addCalculation = () => {
    const newCalc: Calculation = {
      id: `calc_${Date.now()}`,
      targetFieldId: '',
      expression: '',
      label: 'Calculated Value',
    };
    onUpdate([...calculations, newCalc]);
    setSelectedCalc(newCalc.id);
  };

  const updateCalculation = (id: string, updates: Partial<Calculation>) => {
    onUpdate(calculations.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCalculation = (id: string) => {
    onUpdate(calculations.filter(c => c.id !== id));
    setSelectedCalc(null);
  };

  const insertOperator = (calcId: string, operator: string) => {
    const calc = calculations.find(c => c.id === calcId);
    if (!calc) return;
    updateCalculation(calcId, { expression: calc.expression + ' ' + operator + ' ' });
  };

  const insertField = (calcId: string, fieldId: string) => {
    const calc = calculations.find(c => c.id === calcId);
    if (!calc) return;
    updateCalculation(calcId, { expression: calc.expression + fieldId });
    setInsertingField(null);
  };

  const insertFunction = (calcId: string, funcName: string) => {
    const calc = calculations.find(c => c.id === calcId);
    if (!calc) return;
    const func = FUNCTIONS.find(f => f.name === funcName);
    if (func) {
      updateCalculation(calcId, { expression: calc.expression + funcName + '()' });
    }
  };

  const evaluateExpression = (expression: string): number | null => {
    try {
      // Replace field IDs with values (simulated)
      let evalExpr = expression;

      // Simple check for valid expression
      const validChars = /^[0-9+\-*/().%SUMAVGMINMAXIFROUND,\s]+$/;
      if (!validChars.test(evalExpr)) return null;

      // Evaluate (basic - use math.js in production)
      const result = Function('"use strict"; return (' + evalExpr + ')')();
      return typeof result === 'number' && !isNaN(result) ? result : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculated Fields
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Create computed fields using math expressions
          </p>
        </div>
        <button
          onClick={addCalculation}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" />
          Add Calculation
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">How Calculated Fields Work</p>
          <p className="text-blue-700 mt-1">
            Create fields that automatically calculate values based on other fields.
            Use field IDs in your expressions (e.g., <code className="bg-blue-100 px-1 rounded">field_123 + field_456</code>)
          </p>
        </div>
      </div>

      {/* Calculations List */}
      {calculations.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="font-medium text-gray-700 mb-2">No calculations yet</h4>
          <p className="text-sm text-gray-500 mb-4">
            Add calculated fields to compute totals, scores, and more
          </p>
          <button
            onClick={addCalculation}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            Create your first calculation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {calculations.map((calc) => {
            const result = evaluateExpression(calc.expression);
            const isSelected = selectedCalc === calc.id;

            return (
              <motion.div
                key={calc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border rounded-xl overflow-hidden ${
                  isSelected ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Hash className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={calc.label}
                        onChange={(e) => updateCalculation(calc.id, { label: e.target.value })}
                        className="font-medium text-gray-900 bg-transparent border-none outline-none"
                        placeholder="Field Label"
                      />
                      <p className="text-sm text-gray-500">Calculated Field</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result !== null && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        = {result}
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedCalc(isSelected ? null : calc.id)}
                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
                    >
                      {isSelected ? 'Collapse' : 'Edit'}
                    </button>
                    <button
                      onClick={() => deleteCalculation(calc.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Editor */}
                {isSelected && (
                  <div className="p-4 bg-gray-50 space-y-4">
                    {/* Expression Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expression
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={calc.expression}
                          onChange={(e) => updateCalculation(calc.id, { expression: e.target.value })}
                          placeholder="e.g., field_123 + field_456"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {result !== null ? (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-green-600">
                            <span className="text-sm">= {result}</span>
                          </div>
                        ) : calc.expression ? (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-yellow-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">Invalid</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Quick Insert Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Insert Field */}
                      <div className="relative">
                        <button
                          onClick={() => setInsertingField(insertingField === calc.id ? null : calc.id)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-purple-300 hover:text-purple-600"
                        >
                          Insert Field
                        </button>
                        {insertingField === calc.id && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                            {numericFields.map((field) => (
                              <button
                                key={field.id}
                                onClick={() => insertField(calc.id, field.id)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                              >
                                <span className="truncate">{field.question}</span>
                                <code className="text-xs text-purple-600 ml-2">{field.id}</code>
                              </button>
                            ))}
                            {numericFields.length === 0 && (
                              <p className="px-3 py-2 text-sm text-gray-500">No numeric fields available</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Operators */}
                      {OPERATORS.map((op) => (
                        <button
                          key={op.symbol}
                          onClick={() => insertOperator(calc.id, op.symbol)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700 hover:border-purple-300 hover:text-purple-600"
                          title={op.label}
                        >
                          {op.symbol}
                        </button>
                      ))}

                      {/* Functions */}
                      <div className="relative group">
                        <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-purple-300">
                          Functions
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block">
                          {FUNCTIONS.map((func) => (
                            <button
                              key={func.name}
                              onClick={() => insertFunction(calc.id, func.name)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50"
                            >
                              <span className="font-mono text-sm text-purple-600">{func.name}</span>
                              <p className="text-xs text-gray-500">{func.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Numbers */}
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => updateCalculation(calc.id, { expression: calc.expression + num })}
                          className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm font-mono text-gray-700 hover:border-purple-300"
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        onClick={() => updateCalculation(calc.id, { expression: calc.expression + '(' })}
                        className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm font-mono text-gray-700 hover:border-purple-300"
                      >
                        (
                      </button>
                      <button
                        onClick={() => updateCalculation(calc.id, { expression: calc.expression + ')' })}
                        className="px-2 py-1.5 bg-white border border-gray-200 rounded text-sm font-mono text-gray-700 hover:border-purple-300"
                      >
                        )
                      </button>
                    </div>

                    {/* Target Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display in Field
                      </label>
                      <select
                        value={calc.targetFieldId}
                        onChange={(e) => updateCalculation(calc.id, { targetFieldId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="">Select a field to display result...</option>
                        {fields.filter(f => f.type === 'calculation' || f.type === 'number').map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.question}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}