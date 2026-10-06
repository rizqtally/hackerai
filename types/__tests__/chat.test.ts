import {
  canUseExtraUsage,
  canUseMaxModel,
  normalizeMaxModelForSubscription,
  normalizeSelectedModelForSubscription,
  normalizeSelectedModelOverrideForSubscription,
  withExtraUsageBillingForModel,
} from "../chat";

describe("normalizeSelectedModelForSubscription", () => {
  it("forces free users to auto even when a paid model is stored", () => {
    expect(normalizeSelectedModelForSubscription("hackerai-pro", "free")).toBe(
      "auto",
    );
    expect(normalizeSelectedModelForSubscription("hackerai-max", "free")).toBe(
      "auto",
    );
    expect(
      normalizeSelectedModelForSubscription("zai-glm-5.2", "free", true),
    ).toBe("zai-glm-5.2");
    expect(
      normalizeSelectedModelForSubscription("zai-glm-5.2", "free", false),
    ).toBe("auto");
    expect(
      normalizeSelectedModelForSubscription("zai-glm-5.2", "free", true),
    ).toBe("zai-glm-5.2");
    expect(
      normalizeSelectedModelForSubscription("zai-glm-5.2", "free", false),
    ).toBe("auto");
  });

  it("preserves paid users' selected model and defaults missing values to auto", () => {
    expect(normalizeSelectedModelForSubscription("hackerai-pro", "pro")).toBe(
      "hackerai-pro",
    );
    expect(normalizeSelectedModelForSubscription("hackerai-max", "ultra")).toBe(
      "hackerai-max",
    );
    expect(normalizeSelectedModelForSubscription(null, "ultra")).toBe("auto");
    expect(normalizeSelectedModelForSubscription(undefined, "team")).toBe(
      "auto",
    );
  });

  it("preserves paid Max until entitlement-aware routing", () => {
    expect(normalizeSelectedModelForSubscription("hackerai-max", "pro")).toBe(
      "hackerai-max",
    );
    expect(
      normalizeSelectedModelForSubscription("hackerai-max", "pro-plus"),
    ).toBe("hackerai-max");
    expect(normalizeSelectedModelForSubscription("hackerai-max", "team")).toBe(
      "hackerai-max",
    );
  });
});

describe("normalizeSelectedModelOverrideForSubscription", () => {
  it("forces free users to auto even when no override was sent", () => {
    expect(normalizeSelectedModelOverrideForSubscription(null, "free")).toBe(
      "auto",
    );
    expect(
      normalizeSelectedModelOverrideForSubscription(undefined, "free"),
    ).toBe("auto");
    expect(
      normalizeSelectedModelOverrideForSubscription(
        "zai-glm-5.3",
        "free",
        true,
      ),
    ).toBe("zai-glm-5.3");
    expect(
      normalizeSelectedModelOverrideForSubscription(
        "zai-glm-5.3",
        "free",
        true,
      ),
    ).toBe("zai-glm-5.3");
  });

  it("preserves missing paid overrides as undefined", () => {
    expect(
      normalizeSelectedModelOverrideForSubscription(undefined, "pro"),
    ).toBeUndefined();
    expect(
      normalizeSelectedModelOverrideForSubscription(null, "ultra"),
    ).toBeUndefined();
  });

  it("preserves explicit paid overrides until entitlement-aware routing", () => {
    expect(
      normalizeSelectedModelOverrideForSubscription("hackerai-max", "ultra"),
    ).toBe("hackerai-max");
    expect(
      normalizeSelectedModelOverrideForSubscription("hackerai-max", "team"),
    ).toBe("hackerai-max");
    expect(
      normalizeSelectedModelOverrideForSubscription("hackerai-pro", "team"),
    ).toBe("hackerai-pro");
  });
});

describe("Max model entitlement helpers", () => {
  it("allows Max for Ultra users", () => {
    expect(canUseMaxModel("ultra")).toBe(true);
  });

  it("allows Max for paid users with usable extra usage", () => {
    const extraUsageConfig = {
      enabled: true,
      hasBalance: true,
      balanceDollars: 10,
      autoReloadEnabled: false,
    };

    expect(canUseExtraUsage(extraUsageConfig)).toBe(true);
    expect(canUseMaxModel("pro", { extraUsageConfig })).toBe(true);
    expect(
      normalizeMaxModelForSubscription("hackerai-max", "pro", {
        extraUsageConfig,
      }),
    ).toBe("hackerai-max");
  });

  it("downgrades Max-tier GLM models for users without usable extra usage", () => {
    expect(canUseMaxModel("pro")).toBe(false);
    expect(normalizeMaxModelForSubscription("hackerai-max", "pro")).toBe(
      "hackerai-pro",
    );
    expect(normalizeMaxModelForSubscription("zai-glm-5.2", "pro")).toBe(
      "hackerai-pro",
    );
    expect(normalizeMaxModelForSubscription("zai-glm-5.3", "pro")).toBe(
      "hackerai-pro",
    );
    expect(
      normalizeMaxModelForSubscription("zai-glm-5.3", "free", {}, true),
    ).toBe("zai-glm-5.3");
    expect(
      normalizeMaxModelForSubscription("zai-glm-5.3", "free", {}, true),
    ).toBe("zai-glm-5.3");
    expect(
      normalizeMaxModelForSubscription("hackerai-max", "pro-plus", {
        extraUsageConfig: {
          enabled: true,
          hasBalance: true,
          balanceDollars: 10,
          autoReloadEnabled: false,
          monthlyRemainingDollars: 0,
        },
      }),
    ).toBe("hackerai-pro");
  });

  it("applies Max-tier billing rules to GLM 5.2 and 5.3 selections", () => {
    const extraUsageConfig = {
      enabled: true,
      hasBalance: true,
      autoReloadEnabled: false,
    };
    expect(
      withExtraUsageBillingForModel(extraUsageConfig, "zai-glm-5.2", "pro"),
    ).toEqual({ ...extraUsageConfig, chargeAllUsage: true });
    expect(
      withExtraUsageBillingForModel(extraUsageConfig, "zai-glm-5.3", "pro"),
    ).toEqual({ ...extraUsageConfig, chargeAllUsage: true });
    expect(
      withExtraUsageBillingForModel(
        extraUsageConfig,
        "zai-glm-5.3",
        "pro",
        true,
      ),
    ).toBe(extraUsageConfig);
    expect(
      withExtraUsageBillingForModel(
        extraUsageConfig,
        "zai-glm-5.3",
        "pro",
        true,
      ),
    ).toBe(extraUsageConfig);
    expect(
      withExtraUsageBillingForModel(
        extraUsageConfig,
        "zai-glm-5.3-flash",
        "pro",
      ),
    ).toBe(extraUsageConfig);
  });

  it("bills Max entirely through Extra Usage outside Ultra", () => {
    const extraUsageConfig = {
      enabled: true,
      hasBalance: true,
      autoReloadEnabled: false,
    };

    expect(
      withExtraUsageBillingForModel(
        extraUsageConfig,
        "hackerai-max",
        "pro-plus",
      ),
    ).toEqual({
      ...extraUsageConfig,
      chargeAllUsage: true,
    });
    expect(
      withExtraUsageBillingForModel(extraUsageConfig, "hackerai-max", "ultra"),
    ).toBe(extraUsageConfig);
    expect(
      withExtraUsageBillingForModel(
        extraUsageConfig,
        "hackerai-pro",
        "pro-plus",
      ),
    ).toBe(extraUsageConfig);
  });
});
