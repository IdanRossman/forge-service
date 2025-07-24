import { Injectable } from '@nestjs/common';
import { calculateCostPercentile } from './starforce-calculation.utils';

export interface LuckAnalysisResult {
  actualCost: number;
  percentile: number;
  luckRating: 'Very Lucky' | 'Lucky' | 'Average' | 'Unlucky' | 'Very Unlucky';
  description: string;
  betterThanPercent: number;
  worseThanPercent: number;
}

@Injectable()
export class LuckAnalysisService {
  /**
   * Analyze how lucky/unlucky a user's actual cost was compared to simulation results
   */
  analyzeLuck(actualCost: number, costResults: number[]): LuckAnalysisResult {
    const analysis = calculateCostPercentile(actualCost, costResults);

    return {
      actualCost,
      ...analysis,
    };
  }

  /**
   * Generate a shareable luck summary message
   */
  generateLuckSummary(luckResult: LuckAnalysisResult): string {
    const { luckRating, percentile, actualCost } = luckResult;
    const formattedCost = this.formatMesos(actualCost);

    switch (luckRating) {
      case 'Very Lucky':
        return `🍀 EXTREMELY LUCKY! Spent only ${formattedCost} (${percentile}th percentile) - you're blessed by RNG!`;
      case 'Lucky':
        return `✨ Lucky starforcer! ${formattedCost} cost puts you in the ${percentile}th percentile - nice!`;
      case 'Average':
        return `📊 Average luck with ${formattedCost} spent (${percentile}th percentile) - perfectly balanced!`;
      case 'Unlucky':
        return `😬 Tough luck... ${formattedCost} cost is in the ${percentile}th percentile - RNG wasn't kind`;
      case 'Very Unlucky':
        return `💸 RNG BETRAYAL! ${formattedCost} spent puts you in the ${percentile}th percentile - F in chat`;
      default:
        return `Spent ${formattedCost} on starforcing`;
    }
  }

  /**
   * Compare multiple users' luck results (for guild/community features)
   */
  compareLuckResults(results: LuckAnalysisResult[]): {
    luckiest: LuckAnalysisResult;
    unluckiest: LuckAnalysisResult;
    averagePercentile: number;
  } {
    if (results.length === 0) {
      throw new Error('No luck results to compare');
    }

    const luckiest = results.reduce((prev, current) =>
      prev.percentile < current.percentile ? prev : current,
    );

    const unluckiest = results.reduce((prev, current) =>
      prev.percentile > current.percentile ? prev : current,
    );

    const averagePercentile =
      results.reduce((sum, result) => sum + result.percentile, 0) /
      results.length;

    return {
      luckiest,
      unluckiest,
      averagePercentile: Math.round(averagePercentile * 100) / 100,
    };
  }

  private formatMesos(amount: number): string {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  }
}
