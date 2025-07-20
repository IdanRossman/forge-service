import { Test, TestingModule } from '@nestjs/testing';
import { StarforceCostService } from '../../src/starforce-cost/services/starforce-cost.service';
import { StarforceCostRequestDto } from '../../src/starforce-cost/contracts';

describe('StarforceCostService', () => {
  let service: StarforceCostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StarforceCostService],
    }).compile();

    service = module.get<StarforceCostService>(StarforceCostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate starforce cost correctly', () => {
    const request: StarforceCostRequestDto = {
      itemLevel: 150,
      currentStars: 0,
      targetStars: 17,
      server: 'gms',
      safeguardEnabled: false,
      events: {
        starCatching: true,
      },
    };

    const result = service.calculateStarforceCost(request);

    expect(result).toBeDefined();
    expect(result.currentLevel).toBe(0);
    expect(result.targetLevel).toBe(17);
    expect(result.averageCost).toBeGreaterThan(0);
    expect(result.perStarStats).toHaveLength(17);
    expect(result.recommendations).toBeDefined();
  });

  it('should apply Yohi tap event correctly', () => {
    const requestWithoutYohi: StarforceCostRequestDto = {
      itemLevel: 150,
      currentStars: 15,
      targetStars: 17,
      server: 'gms',
      safeguardEnabled: false,
      events: {
        starCatching: true,
        yohiTapEvent: false,
      },
    };

    const requestWithYohi: StarforceCostRequestDto = {
      ...requestWithoutYohi,
      events: {
        ...requestWithoutYohi.events,
        yohiTapEvent: true,
      },
    };

    const resultWithoutYohi =
      service.calculateStarforceCost(requestWithoutYohi);
    const resultWithYohi = service.calculateStarforceCost(requestWithYohi);

    // Yohi's luck should halve the cost
    expect(resultWithYohi.averageCost).toBeLessThan(
      resultWithoutYohi.averageCost,
    );
    expect(resultWithYohi.recommendations.join(' ')).toMatch(/Yohi Tap Event/);
  });

  it('should handle safeguard correctly', () => {
    const requestWithSafeguard: StarforceCostRequestDto = {
      itemLevel: 150,
      currentStars: 15,
      targetStars: 17,
      server: 'gms',
      safeguardEnabled: true,
      events: {},
    };

    const result = service.calculateStarforceCost(requestWithSafeguard);

    expect(result).toBeDefined();
    expect(result.averageCost).toBeGreaterThan(0);

    // Check that boom rates are 0 for safeguarded stars
    const star15Stats = result.perStarStats.find((s) => s.star === 15);
    const star16Stats = result.perStarStats.find((s) => s.star === 16);

    expect(star15Stats?.boomRate).toBe(0);
    expect(star16Stats?.boomRate).toBe(0);
  });

  it('should validate input parameters', () => {
    const invalidRequest: StarforceCostRequestDto = {
      itemLevel: 150,
      currentStars: 17,
      targetStars: 15, // Invalid: current > target
      server: 'gms',
    };

    expect(() => service.calculateStarforceCost(invalidRequest)).toThrow(
      'Current stars must be less than target stars',
    );
  });
});
