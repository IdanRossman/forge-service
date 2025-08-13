import { Injectable } from '@nestjs/common';

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
    const analysis = this.calculateCostPercentile(actualCost, costResults);

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

  /**
   * Calculate what percentile an actual cost falls into
   */
  private calculateCostPercentile(
    actualCost: number,
    costResults: number[],
  ): {
    percentile: number;
    luckRating: 'Very Lucky' | 'Lucky' | 'Average' | 'Unlucky' | 'Very Unlucky';
    description: string;
    betterThanPercent: number;
    worseThanPercent: number;
  } {
    const sortedCosts = [...costResults].sort((a, b) => a - b);
    const totalTrials = sortedCosts.length;

    // Find how many results were worse (higher cost) than the actual cost
    const betterThanActual = sortedCosts.filter(
      (cost) => cost < actualCost,
    ).length;
    const worseThanActual = sortedCosts.filter(
      (cost) => cost > actualCost,
    ).length;

    // Calculate percentile (what percentage of results were worse than actual)
    const percentile =
      Math.round((betterThanActual / totalTrials) * 10000) / 100;
    const worseThanPercent =
      Math.round((worseThanActual / totalTrials) * 10000) / 100;
    const betterThanPercent = percentile;

    // Determine luck rating
    let luckRating:
      | 'Very Lucky'
      | 'Lucky'
      | 'Average'
      | 'Unlucky'
      | 'Very Unlucky';
    let description: string;

    if (percentile <= 10) {
      luckRating = 'Very Lucky';
      description = `🍀 Extremely lucky! Your cost was lower than ${percentile}% of all attempts`;
    } else if (percentile <= 25) {
      luckRating = 'Lucky';
      description = `✨ Lucky! Your cost was lower than ${percentile}% of all attempts`;
    } else if (percentile <= 75) {
      luckRating = 'Average';
      description = `📊 Average luck. Your cost was around the ${percentile}th percentile`;
    } else if (percentile <= 90) {
      luckRating = 'Unlucky';
      description = `😬 Unlucky. Your cost was higher than ${betterThanPercent}% of attempts`;
    } else {
      luckRating = 'Very Unlucky';
      description = `💸 Very unlucky! Your cost was higher than ${betterThanPercent}% of attempts`;
    }

    return {
      percentile,
      luckRating,
      description,
      betterThanPercent,
      worseThanPercent,
    };
  }
}
