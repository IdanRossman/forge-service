# Forge Service - Starforce Cost Calculator API

A NestJS-based REST API service for calculating MapleStory Starforce enhancement costs using Brandon's proven calculator logic with Monte Carlo simulation.

## 🚀 Features

- **Brandon's Proven Logic**: Implements the exact cost formulas and rates from Brandon's working calculator
- **Monte Carlo Simulation**: 1000 trials for statistical accuracy
- **Full Event Support**: 30% off, 5/10/15, star catching, MVP discounts, Yohi Tap Event
- **Server-Specific Rates**: Support for GMS, KMS, MSEA
- **Safeguard Logic**: Prevents item destruction for stars 15-16
- **Per-Star Analytics**: Individual success/boom rates and costs
- **Smart Recommendations**: Context-aware enhancement advice
- **Swagger Documentation**: Interactive API documentation

## 📚 API Documentation

When the server is running, visit **http://localhost:3000/api** for the interactive Swagger documentation.

## 🛠️ Installation & Running

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm test

# Build for production
npm run build
npm run start:prod
```

## 🎯 API Endpoints

### `POST /starforce/calculate`
Calculate starforce enhancement costs with detailed statistics.

#### Example Request:
```json
{
  "itemLevel": 150,
  "currentStars": 0,
  "targetStars": 17,
  "server": "gms",
  "safeguardEnabled": false,
  "events": {
    "starCatching": true,
    "thirtyOff": false,
    "yohiTapEvent": false
  }
}
```

#### Example Response:
```json
{
  "currentLevel": 0,
  "targetLevel": 17,
  "averageCost": 2487564321,
  "averageBooms": 1.2,
  "successRate": 85.5,
  "boomRate": 15.2,
  "costPerAttempt": 146327312,
  "sparesNeeded": 2,
  "perStarStats": [
    {
      "star": 0,
      "successRate": 95.0,
      "boomRate": 0.0,
      "cost": 1250000,
      "maintainRate": 5.0,
      "decreaseRate": 0.0
    }
  ],
  "recommendations": [
    "Consider using Safeguard for stars 15-16 to prevent destruction.",
    "Expected 1.2 booms - prepare 2 spare items."
  ]
}
```

## 🎪 Event Support

| Event | Description | Effect |
|-------|-------------|--------|
| `thirtyOff` | 30% Off Event | Reduces all costs by 30% |
| `fiveTenFifteen` | 5/10/15 Event | Guaranteed success at 5★, 10★, 15★ |
| `starCatching` | Star Catching | +5% multiplicative success rate |
| `mvpDiscount` | MVP Discount | 0-30% cost reduction (stars ≤15) |
| `yohiTapEvent` | 🍀 Yohi's Legendary Luck | Halves ALL costs and boom counts |

## 🎮 Usage Examples

### Basic Enhancement (0★ → 17★)
```bash
curl -X POST http://localhost:3000/starforce/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "itemLevel": 150,
    "currentStars": 0,
    "targetStars": 17,
    "server": "gms",
    "events": {
      "starCatching": true
    }
  }'
```

### High Star Enhancement with Events (15★ → 22★)
```bash
curl -X POST http://localhost:3000/starforce/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "itemLevel": 200,
    "currentStars": 15,
    "targetStars": 22,
    "server": "gms",
    "safeguardEnabled": true,
    "events": {
      "thirtyOff": true,
      "starCatching": true,
      "mvpDiscount": 0.15
    }
  }'
```

### Yohi's Legendary Luck Event
```bash
curl -X POST http://localhost:3000/starforce/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "itemLevel": 160,
    "currentStars": 12,
    "targetStars": 17,
    "server": "gms",
    "safeguardEnabled": true,
    "events": {
      "yohiTapEvent": true,
      "starCatching": true
    }
  }'
```

---

**Built with ❤️ using Brandon's proven starforce calculation logic**
