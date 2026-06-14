'use client';

import React from 'react';

interface AnswerTextProps {
  text: string;
  className?: string;
}

export function AnswerText({ text, className = '' }: AnswerTextProps) {
  // Parse markdown-like formatting
  const formatText = (input: string): React.ReactNode[] => {
    const lines = input.split('\n');
    return lines.map((line, lineIndex) => {
      // Check for bold text
      const parts = line.split(/(\*\*[^*]+\*\*)/g);

      return (
        <React.Fragment key={lineIndex}>
          {parts.map((part, partIndex) => {
            // Bold text
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIndex} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            // Regular text
            return part;
          })}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {formatText(text)}
    </div>
  );
}