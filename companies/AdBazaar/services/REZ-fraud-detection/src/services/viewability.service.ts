import { ViewabilityResult, ViewabilityFactor, ViewabilityFactorType } from '../types';

export class ViewabilityService {
  private minViewabilityScore: number;
  private minTimeInView: number; // ms

  constructor(
    minViewabilityScore: number = 50, // IAB standard is 50%
    minTimeInView: number = 1000 // 1 second
  ) {
    this.minViewabilityScore = minViewabilityScore;
    this.minTimeInView = minTimeInView;
  }

  assess(
    metadata?: {
      timeInView?: number;
      viewportPercentage?: number;
      adPosition?: 'above' | 'below' | 'unknown';
      isBackground?: boolean;
    }
  ): ViewabilityResult {
    const factors: ViewabilityFactor[] = [];

    // Time in view
    const timeFactor = this.assessTimeInView(metadata?.timeInView);
    factors.push(timeFactor);

    // Viewport percentage
    const viewportFactor = this.assessViewport(metadata?.viewportPercentage);
    factors.push(viewportFactor);

    // Ad position
    const positionFactor = this.assessPosition(metadata?.adPosition);
    factors.push(positionFactor);

    // Background vs foreground
    const bgFactor = this.assessBackground(metadata?.isBackground);
    factors.push(bgFactor);

    // Calculate overall score (weighted average)
    const weights = { time: 35, viewport: 30, position: 15, background: 20 };
    const score =
      (timeFactor.value * weights.time / 100) +
      (viewportFactor.value * weights.viewport / 100) +
      (positionFactor.value * weights.position / 100) +
      (bgFactor.value * weights.background / 100);

    const meetsThreshold = score >= this.minViewabilityScore;

    return {
      score: Math.round(score),
      factors,
      meetsThreshold,
    };
  }

  private assessTimeInView(timeInView?: number): ViewabilityFactor {
    if (timeInView === undefined) {
      return {
        type: 'time_in_view',
        value: 50, // Neutral
        description: 'Time in view data not available',
      };
    }

    // Score based on time in view
    let value: number;
    if (timeInView >= 5000) {
      value = 100; // Excellent
    } else if (timeInView >= 2000) {
      value = 80; // Good
    } else if (timeInView >= this.minTimeInView) {
      value = 60; // Acceptable
    } else if (timeInView >= 500) {
      value = 40; // Below threshold
    } else {
      value = 10; // Very low
    }

    return {
      type: 'time_in_view',
      value,
      description: `Time in view: ${timeInView}ms (${value >= 60 ? 'meets' : 'below'} threshold)`,
    };
  }

  private assessViewport(percentage?: number): ViewabilityFactor {
    if (percentage === undefined) {
      return {
        type: 'viewport_percentage',
        value: 50,
        description: 'Viewport percentage not available',
      };
    }

    let value: number;
    if (percentage >= 75) {
      value = 100;
    } else if (percentage >= 50) {
      value = 80;
    } else if (percentage >= 30) {
      value = 60;
    } else if (percentage >= 15) {
      value = 30;
    } else {
      value = 10;
    }

    return {
      type: 'viewport_percentage',
      value,
      description: `Ad occupies ${percentage}% of viewport`,
    };
  }

  private assessPosition(position?: 'above' | 'below' | 'unknown'): ViewabilityFactor {
    let value: number;
    let description: string;

    switch (position) {
      case 'above':
        value = 90;
        description = 'Ad is above the fold (high visibility)';
        break;
      case 'below':
        value = 50;
        description = 'Ad is below the fold (lower visibility)';
        break;
      default:
        value = 70;
        description = 'Ad position unknown';
    }

    return {
      type: 'ad_position',
      value,
      description,
    };
  }

  private assessBackground(isBackground?: boolean): ViewabilityFactor {
    if (isBackground === undefined) {
      return {
        type: 'background_vs_foreground',
        value: 70,
        description: 'Tab visibility unknown',
      };
    }

    return {
      type: 'background_vs_foreground',
      value: isBackground ? 20 : 100,
      description: isBackground
        ? 'Ad rendered while tab was in background'
        : 'Ad rendered in active/focused tab',
    };
  }

  setMinViewabilityScore(score: number): void {
    this.minViewabilityScore = score;
  }

  setMinTimeInView(ms: number): void {
    this.minTimeInView = ms;
  }
}

export const viewabilityService = new ViewabilityService();
