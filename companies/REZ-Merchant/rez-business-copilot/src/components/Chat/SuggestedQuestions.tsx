'use client';

import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Users,
  BarChart3,
  GitCompare,
  Repeat,
  Sun,
  HelpCircle,
} from 'lucide-react';
import { DEFAULT_SUGGESTED_QUESTIONS, SuggestedQuestion } from '@/types/copilot';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  visible?: boolean;
  variant?: 'initial' | 'follow-up';
  className?: string;
}

// Map of icon names to components
const iconMap: Record<string, React.ReactNode> = {
  TrendingDown: <TrendingDown className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  GitCompare: <GitCompare className="w-4 h-4" />,
  Repeat: <Repeat className="w-4 h-4" />,
  Sun: <Sun className="w-4 h-4" />,
  HelpCircle: <HelpCircle className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  analysis: 'bg-amber-100 text-amber-700',
  recommendation: 'bg-green-100 text-green-700',
  comparison: 'bg-purple-100 text-purple-700',
  prediction: 'bg-blue-100 text-blue-700',
  general: 'bg-gray-100 text-gray-700，总',
};

const categoryLabels: Record<string, string> = {
  analysis: 'Analysis',
  recommendation: 'Recommendation',
  comparison: 'Comparison',
  prediction: 'Prediction',
  general: 'General',
};

export function SuggestedQuestions({
  onSelect,
  visible = true,
  variant = 'initial',
  className = '',
}: SuggestedQuestionsProps) {
  if (!visible) return null;

  // Use predefined questions for initial view, or generate generic follow-ups
  const questions: SuggestedQuestion[] =
    variant === 'initial'
      ? DEFAULT_SUGGESTED_QUESTIONS
      : [
          { id: 'follow-1', text: 'Tell me more about that', category: 'general' },
          { id: 'follow-2', text: 'Show the data behind this', category: 'analysis' },
          { id: 'follow-3', text: 'What should I do next?', category: 'recommendation' },
          { id: 'follow-4', text: 'Compare to my competitors', category: 'comparison' },
        ];

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {variant === 'initial' ? 'Try these questions' : 'Ask a follow-up'}
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question.id}
            onClick={() => onSelect(question.text)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all hover:shadow-md hover:scale-105 ${categoryColors[question.category] || categoryColors.general}`}
          >
            {question.icon && iconMap[question.icon]}
            <span>{question.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}