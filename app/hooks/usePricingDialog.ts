import { useEffect, useRef, useState } from "react";
import type { SubscriptionTier } from "@/types";
import { addAuthenticatedExceptionStep, captureAuthenticatedEvent } from "@/lib/analytics/client";
import { toast } from "sonner";

type PricingRedirectAnalytics = {
  surface?: string;
  source?: string;
  from_tier?: SubscriptionTier;
  reason?: string;
  limit_type?: string;
  cta_text?: string;
};

export type PricingDialogContext = {
  surface?: string;
  source?: string;
  fromTier?: SubscriptionTier;
  reason?: string;
  limitType?: string;
};

const PRICING_CONTEXT_PARAMS = {
  surface: "pricing_surface",
  source: "pricing_source",
  fromTier: "pricing_from_tier",
  reason: "pricing_reason",
  limitType: "pricing_limit_type",
} as const;

const readPricingContext = (): PricingDialogContext => {
  const params = new URLSearchParams(window.location.search);
  const fromTier = params.get(PRICING_CONTEXT_PARAMS.fromTier);

  return {
    surface: params.get(PRICING_CONTEXT_PARAMS.surface) ?? undefined,
    source: params.get(PRICING_CONTEXT_PARAMS.source) ?? undefined,
    fromTier:
      fromTier === "free" ||
      fromTier === "pro" ||
      fromTier === "pro-plus" ||
      fromTier === "ultra" ||
      fromTier === "team"
        ? fromTier
        : undefined,
    reason: params.get(PRICING_CONTEXT_PARAMS.reason) ?? undefined,
    limitType: params.get(PRICING_CONTEXT_PARAMS.limitType) ?? undefined,
  };
};

const clearPricingContextParams = (url: URL) => {
  for (const key of Object.values(PRICING_CONTEXT_PARAMS)) {
    url.searchParams.delete(key);
  }
};

const safeDiagnosticLabel = (value: string | undefined): string =>
  value && /^[a-z0-9_-]{1,64}$/i.test(value) ? value : "unknown";

export const usePricingDialog = (subscription?: SubscriptionTier) => {
  const [showPricing, setShowPricing] = useState(false);
  const [pricingContext, setPricingContext] = useState<PricingDialogContext>(
    {},
  );
  const capturedPricingViewRef = useRef(false);
  const previousPricingOpenRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Check if URL hash is #pricing
    const checkHash = () => {
      const shouldShow = window.location.hash === "#pricing";
      if (previousPricingOpenRef.current !== shouldShow) {
        const context = shouldShow ? readPricingContext() : {};
        addAuthenticatedExceptionStep("pricing_dialog_state_changed", {
          open: shouldShow,
          surface: safeDiagnosticLabel(context.surface),
          source: safeDiagnosticLabel(context.source),
          reason: safeDiagnosticLabel(context.reason),
          limit_type: safeDiagnosticLabel(context.limitType),
        });
        previousPricingOpenRef.current = shouldShow;
      }

      // Don't show pricing dialog for ultra/team users
      if (shouldShow && (subscription === "ultra" || subscription === "team")) {
        // Clear the hash
        window.history.replaceState(
          null,
          document.title || "",
          window.location.pathname + window.location.search,
        );
        setShowPricing(false);
        return;
      }

      setShowPricing(shouldShow);
      if (!shouldShow) {
        capturedPricingViewRef.current = false;
        setPricingContext({});
        return;
      }

      const context = readPricingContext();
      setPricingContext(context);

      if (!capturedPricingViewRef.current) {
        if (
          captureAuthenticatedEvent("pricing_viewed", {
            subscription,
            surface: context.surface,
            source: context.source,
            from_tier: context.fromTier,
            reason: context.reason,
            limit_type: context.limitType,
          })
        ) {
          capturedPricingViewRef.current = true;
        }
      }
    };

    // Check on mount
    checkHash();

    // Listen for hash changes
    window.addEventListener("hashchange", checkHash);

    return () => {
      window.removeEventListener("hashchange", checkHash);
    };
  }, [subscription]);

  const handleClosePricing = () => {
    setShowPricing(false);
    // Remove hash from URL
    if (window.location.hash === "#pricing") {
      const url = new URL(window.location.href);
      clearPricingContextParams(url);
      url.hash = "";
      window.history.replaceState(
        null,
        document.title || "",
        `${url.pathname}${url.search}`,
      );
    }
    setPricingContext({});
  };

  const openPricing = () => {
    // Don't allow opening pricing for ultra/team users
    if (subscription === "ultra" || subscription === "team") {
      return;
    }

    const url = new URL(window.location.href);
    clearPricingContextParams(url);
    url.hash = "pricing";
    window.history.pushState(null, document.title || "", url.toString());
    window.dispatchEvent(new Event("hashchange"));
  };

  return {
    showPricing,
    handleClosePricing,
    openPricing,
    pricingContext,
  };
};

// Utility function to redirect to pricing (can be used without the hook)
// Note: This doesn't check subscription tier, so use sparingly
// Consider using openPricing from the hook instead when possible
export const redirectToPricing = (_analytics: PricingRedirectAnalytics = {}) => {
  toast.info("HackerAI is free to use. No payment is required.");
};
