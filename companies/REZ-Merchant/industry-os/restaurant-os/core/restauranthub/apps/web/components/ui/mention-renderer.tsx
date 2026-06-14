'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Store, Package, Wrench, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  detectMentions, 
  getMentionItemById, 
  getMentionMarketplaceUrl, 
  MentionMatch 
} from '@/lib/mention-system';

interface MentionRendererProps {
  content: string;
  className?: string;
}

interface MentionBadgeProps {
  mention: MentionMatch;
  className?: string;
}

function MentionBadge({ mention, className }: MentionBadgeProps) {
  const router = useRouter();
  const item = getMentionItemById(mention.id, mention.type);
  
  if (!item) {
    // Fallback for invalid mentions
    return (
      <Badge variant="outline" className={cn("cursor-default opacity-50", className)}>
        {mention.originalText}
      </Badge>
    );
  }

  const handleClick = () => {
    const url = getMentionMarketplaceUrl(mention);
    router.push(url);
  };

  const getIcon = () => {
    switch (mention.type) {
      case 'vendor': return <Store className="h-3 w-3" />;
      case 'product': return <Package className="h-3 w-3" />;
      case 'service': return <Wrench className="h-3 w-3" />;
      default: return <Store className="h-3 w-3" />;
    }
  };

  const getVariant = () => {
    switch (mention.type) {
      case 'vendor': return 'default';
      case 'product': return 'secondary';
      case 'service': return 'outline';
      default: return 'default';
    }
  };

  const getBgColor = () => {
    switch (mention.type) {
      case 'vendor': return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'product': return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'service': return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      default: return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  return (
    <Badge
      variant={getVariant()}
      className={cn(
        'cursor-pointer transition-all duration-200 group inline-flex items-center space-x-1 mx-0.5',
        getBgColor(),
        className
      )}
      onClick={handleClick}
      title={`Click to view ${item.name} in marketplace`}
    >
      {getIcon()}
      <span className="font-medium">{mention.name}</span>
      {item.verified && (
        <CheckCircle className="h-2.5 w-2.5 text-green-600 ml-1" />
      )}
      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
    </Badge>
  );
}

export function MentionRenderer({ content, className }: MentionRendererProps) {
  if (!content || typeof content !== 'string') {
    return <span className={className}>{content}</span>;
  }
  
  const mentions = detectMentions(content);
  
  if (mentions.length === 0) {
    return <span className={className}>{content}</span>;
  }

  // Split content into segments around mentions
  const segments: Array<{ type: 'text' | 'mention'; content: string; mention?: MentionMatch }> = [];
  let lastIndex = 0;

  mentions.forEach(mention => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex, mention.startIndex)
      });
    }
    
    // Add mention
    segments.push({
      type: 'mention',
      content: mention.originalText,
      mention
    });
    
    lastIndex = mention.endIndex;
  });

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        segment.type === 'mention' && segment.mention ? (
          <MentionBadge 
            key={index}
            mention={segment.mention}
          />
        ) : (
          <span key={index}>{segment.content}</span>
        )
      ))}
    </span>
  );
}

interface MentionSummaryProps {
  content: string;
  className?: string;
}

export function MentionSummary({ content, className }: MentionSummaryProps) {
  if (!content || typeof content !== 'string') return null;
  
  const mentions = detectMentions(content);
  
  if (mentions.length === 0) return null;

  const mentionsByType = mentions.reduce((acc, mention) => {
    if (!acc[mention.type]) acc[mention.type] = [];
    acc[mention.type].push(mention);
    return acc;
  }, {} as Record<string, MentionMatch[]>);

  return (
    <div className={cn("text-xs text-muted-foreground mt-2", className)}>
      <span className="font-medium">Mentions:</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(mentionsByType).map(([type, typeMentions]) => (
          typeMentions.map((mention, index) => (
            <MentionBadge
              key={`${type}-${index}`}
              mention={mention}
              className="text-xs"
            />
          ))
        ))}
      </div>
    </div>
  );
}

interface MentionValidationProps {
  content: string;
  onValidationChange?: (isValid: boolean, invalidMentions: string[]) => void;
}

export function MentionValidation({ content, onValidationChange }: MentionValidationProps) {
  const mentions = detectMentions(content || '');
  const invalidMentions = mentions.filter(mention => 
    mention && !getMentionItemById(mention.id, mention.type)
  );

  React.useEffect(() => {
    onValidationChange?.(invalidMentions.length === 0, invalidMentions.map(m => m?.originalText || '').filter(Boolean));
  }, [content, onValidationChange, invalidMentions.length]);

  if (invalidMentions.length === 0) return null;

  return (
    <div className="text-xs text-destructive mt-2 p-2 bg-destructive/10 rounded">
      <p className="font-medium">Invalid mentions found:</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {invalidMentions.map((mention, index) => (
          <Badge key={index} variant="destructive" className="text-xs">
            {mention.originalText}
          </Badge>
        ))}
      </div>
      <p className="mt-1 opacity-80">These mentions won't be clickable until they match existing items.</p>
    </div>
  );
}