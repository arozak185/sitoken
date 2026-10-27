import React from 'react';
import { GraduationCap, School, BookOpenCheck } from 'lucide-react';

interface SchoolLogoProps {
  className?: string;
  size?: number;
  iconType?: 'graduation' | 'school' | 'book';
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 46,
  iconType = 'graduation',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-xs border border-emerald-500/30 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Ikon Akademik TKA"
    >
      {iconType === 'school' ? (
        <School className="w-6 h-6 text-white drop-shadow-2xs" />
      ) : iconType === 'book' ? (
        <BookOpenCheck className="w-6 h-6 text-white drop-shadow-2xs" />
      ) : (
        <GraduationCap className="w-6 h-6 text-white drop-shadow-2xs" />
      )}
    </div>
  );
};
