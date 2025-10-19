# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forge Service is a NestJS-based REST API for calculating MapleStory enhancement costs:
- **Starforce Enhancement**: Calculate costs for upgrading equipment stars using Monte Carlo simulation with multiple server-specific strategies
- **Potential/Cubing**: Calculate probability and costs for achieving desired potential lines on equipment
- **Equipment Management**: Supabase-backed storage for equipment data and templates

## Development Commands

### Building and Running
```bash
npm run build              # Compile TypeScript to dist/
npm run start:dev          # Development mode with hot reload
npm run start:prod         # Production mode (requires build first)
npm start                  # Production mode (after build)
```

### Testing
```bash
npm test                   # Run all tests
npm run test:watch         # Watch mode for tests
npm run test:cov           # Generate coverage report
npm run test:e2e           # End-to-end tests
```

### Code Quality
```bash
npm run lint               # Lint and auto-fix TypeScript files
npm run format             # Format code with Prettier
```

### Running Single Tests
```bash
npm test -- starforce-cost.service.spec.ts     # Run specific test file
npm test -- --testNamePattern="should calculate" # Run tests matching pattern
```

## Architecture

### Module Structure

The codebase follows NestJS modular architecture with 5 primary modules:

1. **StarforceCostModule** (`src/starforce-cost/`)
   - Controllers: `StarforceCostController` - Handles bulk and single item starforce calculations
   - Services:
     - `StarforceCostService` - Main orchestrator for starforce calculations
     - `StarForceCalculationService` - Core Monte Carlo simulation engine
     - `StarforceOptimizationService` - Recommends optimal upgrade strategies
     - `StarforceStatCalculationService` - Calculates stat gains from stars
     - `LuckAnalysisService` - Analyzes luck during enhancement attempts
   - Strategies: Strategy pattern for server-specific rates
     - `LegacyStarforceStrategy` - Original GMS/MSEA rates
     - `NewKmsStarforceStrategy` - Updated KMS rates
     - Interface: `StarforceCalculationStrategy` defines contract

2. **PotentialCostModule** (`src/potential-cost/`)
   - Controllers: `PotentialCostController` - Calculate cubing costs/probabilities
   - Services:
     - `PotentialService` - Main orchestrator
     - `PotentialCalculationService` - Core probability calculation engine
     - `PotentialCostService` - Cost calculations for cubes
     - `CubeRatesDataService` - Manages cube rate data
   - Data: `src/potential-cost/data/` contains cube rates for different tiers/items

3. **EquipmentModule** (`src/equipment/`)
   - Controllers: `EquipmentController` - CRUD operations for equipment
   - Integrates with Supabase for persistent storage
   - Job class mapping: `job-class-mapping.ts` handles job-to-class conversions

4. **TemplatesModule** (`src/templates/`)
   - Controllers: `TemplatesController` - Manage equipment set templates
   - Services: `TemplateService` - Template business logic

5. **DatabaseModule** (`src/database/`)
   - Services: `SupabaseService` - Centralized Supabase client and database operations
   - Exports client for use across modules

### Key Design Patterns

**Strategy Pattern (Starforce)**
- `StarforceCalculationStrategy` interface allows swapping calculation logic
- Currently supports `legacy` and `new-kms` strategies
- Strategies are injectable NestJS services, selected at runtime via request parameter

**Monte Carlo Simulation**
- Both starforce and potential calculations use statistical simulation
- Starforce: 1000 trials (≤22 stars) or 250 trials (>22 stars) for performance
- Results include percentiles (median, p75) and standard deviation

**Service Layer Separation**
- Controllers handle HTTP concerns only
- Services contain all business logic
- Clear separation between calculation engines and orchestrators

### Important Implementation Details

**Starforce Calculation Flow**:
1. `StarforceCostController` receives bulk request with shared events
2. `StarforceCostService` orchestrates per-item calculations
3. `StarForceCalculationService` selects strategy and runs Monte Carlo trials
4. Strategy implements server-specific rates and cost formulas
5. Results aggregated with boom statistics and recommendations

**Potential Calculation Flow**:
1. Load cube rates from `CubeRatesDataService` based on tier/item/cube type
2. `PotentialCalculationService` consolidates rates (groups irrelevant lines as "junk")
3. Iterate through all possible 3-line combinations
4. Check if outcome satisfies input requirements using match functions
5. Calculate probability accounting for special line restrictions (max 2 boss lines, etc.)
6. `PotentialCostService` converts probability to expected cost

**Special Starforce Mechanics**:
- Stars 15-16: Safeguard prevents destruction (increases cost, prevents boom)
- Star catching: +5% multiplicative success rate
- 30% off: Cost reduction
- 5/10/15 event: Guaranteed success at those stars
- Yohi Tap Event: Halves costs and boom counts

**Potential Special Lines**:
- Some categories limited (boss damage max 2 lines, IED max 2, etc.)
- Level 160+ items get +1% on certain stat categories
- Rates adjusted dynamically when special line limits are reached

## Environment Variables

Required for Supabase integration:
```bash
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
PORT=3000  # Optional, defaults to 3000
```

The application validates these on startup in `main.ts` and logs their status.

## API Documentation

Interactive Swagger docs available at `/api` when server is running.

Main endpoints:
- `POST /Starforce/calculate-bulk` - Primary starforce endpoint (multiple items, shared events)
- `POST /Starforce/optimize` - Get optimization recommendations
- `POST /potential/calculate` - Single potential calculation
- `POST /potential/bulk-calculate-individual-cubes` - Multiple items with different cube types
- `GET /equipment` - List all equipment
- `GET /templates` - List equipment templates

## Testing Guidelines

- Test files colocated with source: `test/` directory mirrors `src/` structure
- Use NestJS testing utilities: `@nestjs/testing` for module compilation
- Example test structure in `test/starforce-cost/starforce-cost.service.spec.ts`
- Tests verify calculation accuracy, event application, and input validation

## Common Gotchas

1. **Strategy Selection**: Default is `legacy`. Use `strategy: 'new-kms'` for KMS rates. The service handles typos like 'legecy'.

2. **Boom Results**: Only available when calculation runs Monte Carlo (not for simple cost lookups). Check if `boomResults` exists before accessing.

3. **Item Type Conversion**: `PotentialCalculationService.convertItemType()` maps client-friendly names (ring, pendant) to internal cube data keys. Some types map to the same key (all accessories → 'ring').

4. **Cost Distribution**: Starforce returns min/max/stdDev in `costDistribution`. Use `returnCostResults: true` to get raw trial data.

5. **Cube Rates Data**: Lives in JavaScript file `cubeRates.js` at project root. TypeScript compiler configured to allow `.js` imports via `allowJs: true`.

6. **Supabase Queries**: Job filtering uses complex OR logic with class matching. See `SupabaseService.getEquipmentByJobAndType()` for pattern.
