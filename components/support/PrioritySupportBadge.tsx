"use client";

import { Badge } from "@/components/ui/badge";
import { Zap, HeadphonesIcon } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";

interface PrioritySupportBadgeProps {
  variant?: "default" | "compact" | "icon-only";
  showEnterpriseDedicated?: boolean;
}

export default function PrioritySupportBadge({
  variant = "default",
  showEnterpriseDedicated = true,
}: PrioritySupportBadgeProps) {
  const { isPro, isEnterprise, loading } = useSubscription();

  if (loading) {
    return null;
  }

  if (!isPro && !isEnterprise) {
    return null;
  }

  if (variant === "icon-only") {
    return (
      <div className="flex items-center gap-1" title={isEnterprise ? "Dedicated Support" : "Priority Support"}>
        <Zap className="h-4 w-4 text-yellow-500" />
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <Badge
        variant="outline"
        className={`flex items-center gap-1 ${
          isEnterprise
            ? "border-purple-500/50 text-purple-400 bg-purple-500/10"
            : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
        }`}
      >
        <Zap className="h-3 w-3" />
        <span className="text-xs">
          {isEnterprise ? "Dedicated" : "Priority"}
        </span>
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={`flex items-center gap-1.5 ${
          isEnterprise
            ? "border-purple-500/50 text-purple-400 bg-purple-500/10"
            : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
        }`}
      >
        {isEnterprise ? (
          <HeadphonesIcon className="h-3.5 w-3.5" />
        ) : (
          <Zap className="h-3.5 w-3.5" />
        )}
        <span className="text-xs font-medium">
          {isEnterprise ? "Dedicated Support" : "Priority Support"}
        </span>
      </Badge>
      {showEnterpriseDedicated && isEnterprise && (
        <span className="text-xs text-gray-400">
          Direct access to our team
        </span>
      )}
    </div>
  );
}

