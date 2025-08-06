export interface StarforceOptimizationRequestDto {
  items: Array<{
    itemLevel: number;
    fromStar: number;
    toStar: number;
    safeguardEnabled?: boolean;
    spareCount?: number;
    spareCost?: number;
    itemName?: string;
    itemType?: string; // e.g., 'weapon', 'secondary', 'gloves', 'helm', 'top', 'bottom', etc.
    base_attack?: number; // Required for weapons to calculate 2% visible ATT gains
  }>;
  availableMeso: number;
  isInteractive?: boolean;
  events?: {
    thirtyOff?: boolean;
    fiveTenFifteen?: boolean;
    starCatching?: boolean;
    mvpDiscount?: boolean;
  };
  riskTolerance?: 'conservative' | 'balanced' | 'aggressive';
}

export interface StarforceOptimizationResponseDto {
  budget: {
    available: number;
    used: number;
    remaining: number;
  };
  starsGained: {
    total: number;
    byItem: Array<{
      itemName: string;
      originalTarget: number;
      starsGained: number;
      finalStar: number;
      stepsCompleted: number;
      totalCost: number;
    }>;
  };
  actionPlan: Array<{
    step: number;
    action: string;
    fromStar: number;
    toStar: number;
    expectedCost: number;
    expectedBooms: number;
    riskLevel: string;
    efficiency: number;
    cumulativeCost: number;
    remainingBudget: number;
    specialNote?: string;
    statGains: {
      jobStat: number;
      visibleAtt: number;
      magicAtt: number;
      weaponAtt: number;
      hp: number;
      mp: number;
      def: number;
      totalValue: number;
    };
  }>;
  achievableTargets: Array<{
    itemIndex: number;
    itemName: string;
    originalTarget: number;
    achievableTarget: number;
    starsGained: number;
    starsShortfall: number;
  }>;
  originalTargets: Array<{
    itemName: string;
    fromStar: number;
    requestedTarget: number;
    achievableTarget: number;
    starsShortfall: number;
  }>;
  analysis: {
    starsMetrics: {
      requested: number;
      achievable: number;
      shortfall: number;
      completionRate: number;
    };
    budgetMetrics: {
      efficiency: number;
      utilizationRate: number;
      costPerStar: number;
    };
    itemsStatus: {
      fullyAchievable: number;
      partiallyAchievable: number;
      notAchievable: number;
    };
    riskAssessment: {
      highRiskSteps: number;
      mediumRiskSteps: number;
      overallRisk: string;
    };
    eventBenefits?: {
      guaranteedSuccesses: number;
      mesoSaved: number;
      riskReduced: string;
    };
  };
  recommendations: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
}
