import React from "react";
import { getAgeCategory } from "@/lib/utils/age";

interface AgeBadgeProps {
  dateOfBirth?: string | Date | null;
  age?: number | null;
  className?: string;
  showCategoryName?: boolean;
}

export const AgeBadge: React.FC<AgeBadgeProps> = ({
  dateOfBirth,
  age: explicitAge,
  className = "",
  showCategoryName = false,
}) => {
  const categoryInfo = getAgeCategory(
    explicitAge !== undefined && explicitAge !== null ? explicitAge : dateOfBirth,
  );

  if (!categoryInfo) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border shadow-xs transition-all ${categoryInfo.badgeClass} ${className}`}
      title={`Age: ${categoryInfo.age} (${categoryInfo.categoryName})`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${categoryInfo.dotColor} shrink-0 animate-pulse`}
      />
      <span>{categoryInfo.label}</span>
      {showCategoryName && (
        <span className="opacity-70 font-normal">
          • {categoryInfo.categoryName}
        </span>
      )}
    </span>
  );
};

export default AgeBadge;
