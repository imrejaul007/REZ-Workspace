'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Store, Package, Wrench, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchMentionableItems, MentionItem } from '@/lib/mention-system';

interface MentionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onMentionSelect: (mention: MentionItem, symbol: string) => void;
  className?: string;
}

export function MentionAutocomplete({ 
  textareaRef, 
  onMentionSelect, 
  className 
}: MentionAutocompleteProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSymbol, setMentionSymbol] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Monitor textarea input for mention triggers
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      const cursorPos = textarea.selectionStart;
      const text = textarea.value;
      
      // Look for mention triggers (@, #, $) before cursor
      const beforeCursor = text.slice(0, cursorPos);
      const mentionMatch = beforeCursor.match(/[@#$]([A-Za-z0-9\s\-&'.]*)$/);
      
      if (mentionMatch) {
        const fullMatch = mentionMatch[0];
        const symbol = fullMatch[0];
        const query = mentionMatch[1];
        const startPos = cursorPos - fullMatch.length;
        
        setMentionQuery(query);
        setMentionSymbol(symbol);
        setMentionStartPos(startPos);
        
        // Search for suggestions
        if (query.length >= 0) {
          const results = searchMentionableItems(query, 8);
          setSuggestions(results);
          setSelectedIndex(0);
          setIsVisible(true);
          
          // Calculate position
          updatePosition(textarea, startPos + 1); // +1 for the symbol
        }
      } else {
        setIsVisible(false);
        setSuggestions([]);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            handleMentionSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsVisible(false);
          break;
      }
    };

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('keydown', handleKeyDown);

    return () => {
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('keydown', handleKeyDown);
    };

  }, [textareaRef, isVisible, suggestions, selectedIndex]);

  // Handle clicks outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updatePosition = (textarea: HTMLTextAreaElement, cursorPos: number) => {
    const rect = textarea.getBoundingClientRect();
    const style = getComputedStyle(textarea);
    
    // Create a temporary div to measure text
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.font = style.font;
    div.style.lineHeight = style.lineHeight;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.width = style.width;
    
    // Get text up to cursor position
    div.textContent = textarea.value.substring(0, cursorPos);
    document.body.appendChild(div);
    
    const span = document.createElement('span');
    span.textContent = '|';
    div.appendChild(span);
    
    const spanRect = span.getBoundingClientRect();
    document.body.removeChild(div);
    
    setPosition({
      top: spanRect.bottom + 5,
      left: spanRect.left
    });
  };

  const handleMentionSelect = (mention: MentionItem) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeMention = textarea.value.slice(0, mentionStartPos);
    const afterMention = textarea.value.slice(textarea.selectionStart);
    
    // Insert the mention
    const mentionText = `${mentionSymbol}${mention.name}`;
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    const newCursorPos = mentionStartPos + mentionText.length + 1;
    
    textarea.value = newValue;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    
    // Trigger input event to update parent component
    const event = new Event('input', { bubbles: true });
    textarea.dispatchEvent(event);
    
    onMentionSelect(mention, mentionSymbol);
    setIsVisible(false);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'vendor': return <Store className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'service': return <Wrench className="h-4 w-4" />;
      default: return <Store className="h-4 w-4" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'text-blue-600 bg-blue-50';
      case 'product': return 'text-green-600 bg-green-50';
      case 'service': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getMentionSymbolHelper = (symbol: string) => {
    switch (symbol) {
      case '@': return 'Type @VendorName to mention vendors';
      case '#': return 'Type #ProductName to mention products';  
      case '$': return 'Type $ServiceName to mention services';
      default: return 'Type @, #, or $ to mention items';
    }
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'fixed z-50 bg-white border border-border rounded-lg shadow-lg max-w-md w-80',
          className
        )}
        style={{
          top: position.top,
          left: position.left
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {getMentionSymbolHelper(mentionSymbol)}
          </p>
        </div>
        
        {/* Suggestions List */}
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((item, index) => (
            <motion.button
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleMentionSelect(item)}
              className={cn(
                'w-full px-3 py-2 text-left flex items-start space-x-3 hover:bg-accent transition-colors',
                index === selectedIndex && 'bg-accent'
              )}
            >
              {/* Avatar/Icon */}
              <div className="flex-shrink-0">
                {item.avatar ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center',
                    getItemTypeColor(item.type)
                  )}>
                    {getItemIcon(item.type)}
                  </div>
                )}
              </div>
              
              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.verified && (
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                  {item.category && (
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                
                {/* Additional Info */}
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  {item.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}</span>
                    </div>
                  )}
                  {item.price && (
                    <span className="font-medium">
                      ${item.price}{item.unit ? `/${item.unit}` : ''}
                    </span>
                  )}
                </div>
                
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        
        {/* Footer */}
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            ↑↓ navigate • Enter to select • Esc to close
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}