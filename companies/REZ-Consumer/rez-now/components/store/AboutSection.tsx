'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image?: string;
  bio?: string;
}

interface AboutSectionProps {
  /** Merchant story / about text (supports basic markdown-like formatting) */
  story?: string;
  /** Team members to showcase */
  team?: TeamMember[];
  /** Optional cover/banner image for the about section */
  coverImage?: string;
  className?: string;
}

function formatStory(text: string): React.ReactNode[] {
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((paragraph, idx) => {
      // Handle bold text (**text**)
      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={idx} className="text-gray-700 leading-relaxed">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
}

function TeamCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 mb-3">
        {member.image ? (
          <Image
            src={member.image}
            alt={member.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-indigo-500">
            {initials}
          </div>
        )}
      </div>
      <h4 className="font-semibold text-gray-900 text-sm">{member.name}</h4>
      <p className="text-xs text-indigo-600 font-medium">{member.role}</p>
      {member.bio && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{member.bio}</p>
      )}
    </div>
  );
}

export default function AboutSection({ story, team, coverImage, className }: AboutSectionProps) {
  const [imageError, setImageError] = useState(false);

  if (!story && (!team || team.length === 0) && !coverImage) {
    return null;
  }

  return (
    <section className={cn('py-8 px-4', className)} aria-labelledby="about-heading">
      <div className="max-w-3xl mx-auto">
        {/* Cover Image */}
        {coverImage && !imageError && (
          <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-indigo-100 to-purple-100">
            <Image
              src={coverImage}
              alt="About us"
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Story */}
        {story && (
          <div className="mb-8">
            <h2 id="about-heading" className="text-xl font-bold text-gray-900 mb-4">
              Our Story
            </h2>
            <div className="space-y-4">
              {formatStory(story)}
            </div>
          </div>
        )}

        {/* Team */}
        {team && team.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Meet the Team</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {team.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
