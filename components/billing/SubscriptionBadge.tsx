"use client";

import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/hooks/useSubscription";

interface SubscriptionBadgeProps {
  className?: string;
}

export default function SubscriptionBadge({ className }: SubscriptionBadgeProps) {
  const { plan, loading } = useSubscription();

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        Loading...
      </Badge>
    );
  }

  const getVariant = () => {
    switch (plan) {
      case "free":
        return "secondary";
      case "pro":
        return "default";
      case "enterprise":
        return "default";
      default:
        return "outline";
    }
  };

  const getDisplayName = () => {
    switch (plan) {
      case "free":
        return "Free";
      case "pro":
        return "Pro";
      case "enterprise":
        return "Enterprise";
      default:
        return plan;
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {getDisplayName()}
    </Badge>
  );
}

