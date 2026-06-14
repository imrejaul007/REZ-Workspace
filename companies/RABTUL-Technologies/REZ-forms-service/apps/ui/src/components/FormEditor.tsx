'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Type, AlignLeft, Mail, Phone, Hash, Calendar, Clock,
  Globe, Upload, List, ChevronDown, Star, Sliders,
  CheckSquare, FileSignature, CreditCard, Calculator,
  Eye, Plus, Trash2, GripVertical, Copy, MoreVertical,
  Heading1, Minus, Columns2
} from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  question: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FormBlock {
  id: string;
  type: string;
  fieldId?: string;
  content?: string;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  blocks: FormBlock[];
  fields: FormField[];
  settings: any;
  branding: any;
}

interface FormEditorProps {
  form: Form;
  onUpdate: (updates: Partial<Form>) => void;
}

const FIELD_TYPES = [
  { type: 'short_text', label: 'Short Text', icon: Type },
  { type: 'long_text', label: 'Long Text', icon: AlignLeft },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'time', label: 'Time', icon: Clock },
  { type: 'url', label: 'URL', icon: Globe },
  { type: 'file_upload', label: 'File Upload', icon: Upload },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: List },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'yes_no', label: 'Yes/No', icon: CheckSquare },
  { type: 'rating', label: 'Rating', icon: Star },
  { type: 'scale', label: 'Scale', icon: Sliders },
  { type: 'signature', label: 'Signature', icon: FileSignature },
  { type: 'payment', label: 'Payment', icon: CreditCard },
  { type: 'calculation', label: 'Calculation', icon: Calculator },
];

const LAYOUT_BLOCKS = [
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'columns', label: 'Columns', icon: Columns2 },
];

export function FormEditor({ form, onUpdate }: FormEditorProps) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const addField = (type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      question: 'New question',
      required: false,
      placeholder: '',
      options: type === 'multiple_choice' || type === 'dropdown' || type === 'checkbox'
        ? ['Option 1', 'Option 2', 'Option 3']
        : undefined,
    };

    const newBlock: FormBlock = {
      id: `block_${Date.now()}`,
      type: 'field',
      fieldId: newField.id,
    };

    onUpdate({
      fields: [...form.fields, newField],
      blocks: [...form.blocks, newBlock],
    });

    setShowFieldPicker(false);
    setSelectedBlock(newBlock.id);
  };

  const addLayoutBlock = (type: string) => {
    const newBlock: FormBlock = {
      id: `block_${Date.now()}`,
      type,
      content: type === 'heading' ? 'Heading' : 'Add your text here...',
    };

    onUpdate({
      blocks: [...form.blocks, newBlock],
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    onUpdate({
      fields: form.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const deleteBlock = (blockId: string) => {
    const block = form.blocks.find(b => b.id === blockId);
    onUpdate({
      blocks: form.blocks.filter(b => b.id !== blockId),
      fields: block?.fieldId
        ? form.fields.filter(f => f.id !== block.fieldId)
        : form.fields,
    });
    setSelectedBlock(null);
  };

  const getFieldForBlock = (block: FormBlock) => {
    return block.fieldId ? form.fields.find(f => f.id === block.fieldId) : null;
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar - Field Picker */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
          <h3 className="font-semibold text-gray-900 mb-4">Add Fields</h3>

          {/* Question Fields */}
          <div className="space-y-2 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Questions</p>
            {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addField(type)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
              </button>
            ))}
          </div>

          {/* Layout Blocks */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Layout</p>
            {LAYOUT_BLOCKS.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addLayoutBlock(type)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 min-h-[600px]">
          {/* Form Header */}
          <div className="p-8 border-b border-gray-100">
            <input
              type="text"
              value={form.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="text-2xl font-bold text-gray-900 w-full border-none outline-none placeholder-gray-300"
              placeholder="Untitled Form"
            />
            <input
              type="text"
              value={form.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="mt-2 text-gray-500 w-full border-none outline-none placeholder-gray-300"
              placeholder="Add a description..."
            />
          </div>

          {/* Blocks */}
          <div className="p-8 space-y-4">
            <AnimatePresence>
              {form.blocks.map((block, index) => {
                const field = getFieldForBlock(block);
                const isSelected = selectedBlock === block.id;

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`relative group ${
                      isSelected ? 'ring-2 ring-purple-500 ring-offset-2 rounded-lg' : ''
                    }`}
                    onClick={() => setSelectedBlock(block.id)}
                  >
                    {/* Block Actions */}
                    <div className={`absolute -left-12 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                      <button className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 cursor-grab">
                        <GripVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="absolute -right-12 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Block Content */}
                    {block.type === 'field' && field && (
                      <FieldBlock
                        field={field}
                        onUpdate={(updates) => updateField(field.id, updates)}
                      />
                    )}

                    {block.type === 'heading' && (
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => {
                          const newBlocks = form.blocks.map(b =>
                            b.id === block.id ? { ...b, content: e.target.value } : b
                          );
                          onUpdate({ blocks: newBlocks });
                        }}
                        className="text-xl font-bold text-gray-900 w-full border-none outline-none"
                        placeholder="Heading"
                      />
                    )}

                    {block.type === 'paragraph' && (
                      <textarea
                        value={block.content}
                        onChange={(e) => {
                          const newBlocks = form.blocks.map(b =>
                            b.id === block.id ? { ...b, content: e.target.value } : b
                          );
                          onUpdate({ blocks: newBlocks });
                        }}
                        className="text-gray-600 w-full border-none outline-none resize-none"
                        placeholder="Add your text here..."
                        rows={2}
                      />
                    )}

                    {block.type === 'divider' && (
                      <hr className="border-gray-200" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Add Field Button */}
            <button
              onClick={() => setShowFieldPicker(!showFieldPicker)}
              className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-purple-300 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add a question
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Field Settings */}
      <AnimatePresence>
        {selectedBlock && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-72 flex-shrink-0"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Settings</h3>

              {(() => {
                const block = form.blocks.find(b => b.id === selectedBlock);
                const field = block?.fieldId ? form.fields.find(f => f.id === block.fieldId) : null;

                if (!field) {
                  return (
                    <p className="text-sm text-gray-500">Select a field to edit its settings</p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Question */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <input
                        type="text"
                        value={field.question}
                        onChange={(e) => updateField(field.id, { question: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={field.description || ''}
                        onChange={(e) => updateField(field.id, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={2}
                        placeholder="Add a description..."
                      />
                    </div>

                    {/* Required Toggle */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Required
                      </label>
                      <button
                        onClick={() => updateField(field.id, { required: !field.required })}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          field.required ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          field.required ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Placeholder */}
                    {(field.type === 'short_text' || field.type === 'long_text' || field.type === 'email' || field.type === 'phone' || field.type === 'url' || field.type === 'number') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Type here..."
                        />
                      </div>
                    )}

                    {/* Options (for choice fields) */}
                    {field.options && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options
                        </label>
                        <div className="space-y-2">
                          {field.options.map((option, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...field.options!];
                                  newOptions[i] = e.target.value;
                                  updateField(field.id, { options: newOptions });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                onClick={() => {
                                  const newOptions = field.options!.filter((_, idx) => idx !== i);
                                  updateField(field.id, { options: newOptions });
                                }}
                                className="p-2 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              updateField(field.id, { options: [...field.options!, `Option ${field.options.length + 1}`] });
                            }}
                            className="text-sm text-purple-600 hover:text-purple-700"
                          >
                            + Add option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Field Block Component
function FieldBlock({ field, onUpdate }: { field: FormField; onUpdate: (updates: Partial<FormField>) => void }) {
  const FieldIcon = FIELD_TYPES.find(t => t.type === field.type)?.icon || Type;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <FieldIcon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500 uppercase">{field.type.replace('_', ' ')}</span>
        {field.required && (
          <span className="text-xs text-red-500 font-medium">Required</span>
        )}
      </div>

      <h3 className="font-medium text-gray-900">
        {field.question}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </h3>

      {field.description && (
        <p className="text-sm text-gray-500 mt-1">{field.description}</p>
      )}

      {/* Field Input Preview */}
      <div className="mt-3">
        {field.type === 'short_text' && (
          <input
            type="text"
            placeholder={field.placeholder || 'Type here...'}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            disabled
          />
        )}

        {field.type === 'long_text' && (
          <textarea
            placeholder={field.placeholder || 'Type here...'}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            rows={3}
            disabled
          />
        )}

        {field.type === 'email' && (
          <input
            type="email"
            placeholder={field.placeholder || 'email@example.com'}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            disabled
          />
        )}

        {field.type === 'phone' && (
          <input
            type="tel"
            placeholder={field.placeholder || '+91 98765 43210'}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            disabled
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            placeholder={field.placeholder || '0'}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            disabled
          />
        )}

        {field.type === 'date' && (
          <input
            type="date"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white"
            disabled
          />
        )}

        {field.type === 'multiple_choice' && (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'dropdown' && (
          <select className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white">
            <option value="">Select...</option>
            {field.options?.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            ))}
          </select>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <label key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300">
                <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'yes_no' && (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg cursor-pointer flex-1">
              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg cursor-pointer flex-1">
              <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
              <span>No</span>
            </label>
          </div>
        )}

        {field.type === 'rating' && (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-gray-300" />
            ))}
          </div>
        )}

        {field.type === 'file_upload' && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-white">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          </div>
        )}
      </div>
    </div>
  );
}