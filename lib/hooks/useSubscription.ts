"use client";

import { useCustomer } from "autumn-js/react";

const PLAN_PRODUCT_IDS = {
  pro: "pro_plan",
  enterprise: "enterprise_plan",
} as const;

const PRODUCT_ID_TO_PLAN = {
  pro_plan: "pro" as const,
  enterprise_plan: "enterprise" as const,
} as const;

export function useSubscription() {
  const { customer, attach, check, track, cancel, openBillingPortal, isLoading, error } = useCustomer();

  const getPlanFromCustomer = (): SubscriptionPlan => {
    if (!customer?.products || customer.products.length === 0) {
      return "free";
    }
    
    const isActive = (status: string) => status === "active" || status === "trialing";
    

    if (customer.products.some(p => p.id === PLAN_PRODUCT_IDS.enterprise && isActive(p.status))) {
      return "enterprise";
    }
    
    if (customer.products.some(p => p.id === PLAN_PRODUCT_IDS.pro && isActive(p.status))) {
      return "pro";
    }

    const activeProduct = customer.products.find(p => 
      isActive(p.status) && p.id in PRODUCT_ID_TO_PLAN
    );
    
    if (activeProduct) {
      return PRODUCT_ID_TO_PLAN[activeProduct.id as keyof typeof PRODUCT_ID_TO_PLAN];
    }

    return "free";
  };

  const plan: SubscriptionPlan = getPlanFromCustomer();
  
  return {
    plan,
    isFree: plan === "free",
    isPro: plan === "pro",
    isEnterprise: plan === "enterprise",
    
    customer,
    customerId: customer?.id,
    
    allowed: (options: { featureId: string }) => {
      const result = check({ featureId: options.featureId });
      return result.data?.allowed ?? false;
    },
    
    track: async (options: { featureId: string; value?: number }) => {
      return track(options);
    },
    

    upgrade: async (options: { productId: string; successUrl?: string; cancelUrl?: string; dialog?: any }) => {
      const autumnProductId = PLAN_PRODUCT_IDS[options.productId as keyof typeof PLAN_PRODUCT_IDS] || options.productId;
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const defaultSuccessUrl = `${baseUrl}/portfolio?upgraded=true`;
      const defaultCancelUrl = `${baseUrl}/portfolio`;
      
      const checkoutSessionParams: Record<string, any> = {};
      if (options.cancelUrl || defaultCancelUrl) {
        checkoutSessionParams.cancel_url = options.cancelUrl || defaultCancelUrl;
      }
      
      return attach({ 
        ...options, 
        productId: autumnProductId,
        successUrl: options.successUrl || defaultSuccessUrl,
        checkoutSessionParams: Object.keys(checkoutSessionParams).length > 0 ? checkoutSessionParams : undefined,
      });
    },
    
    openBillingPortal: async (options?: { returnUrl?: string; openInNewTab?: boolean }) => {
      return openBillingPortal(options);
    },
    
    cancel: async (options: { productId: string }) => {
      const autumnProductId = PLAN_PRODUCT_IDS[options.productId as keyof typeof PLAN_PRODUCT_IDS] || options.productId;
      return cancel({ productId: autumnProductId });
    },

    loading: isLoading,
    error,
  };
}

