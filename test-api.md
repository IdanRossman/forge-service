# Starforce API Test

## Test Basic Calculation
curl -X POST http://localhost:3000/starforce/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "itemLevel": 150,
    "currentStars": 0,
    "targetStars": 17,
    "server": "gms",
    "safeguardEnabled": false,
    "events": {
      "starCatching": true
    }
  }'

## Test with Yohi Tap Event
curl -X POST http://localhost:3000/starforce/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "itemLevel": 150,
    "currentStars": 15,
    "targetStars": 17,
    "server": "gms",
    "safeguardEnabled": true,
    "events": {
      "starCatching": true,
      "thirtyOff": true,
      "yohiTapEvent": true
    }
  }'

## Test with 5/10/15 Event
curl -X POST http://localhost:3000/starforce/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "itemLevel": 200,
    "currentStars": 10,
    "targetStars": 15,
    "server": "gms",
    "safeguardEnabled": false,
    "events": {
      "fiveTenFifteen": true,
      "mvpDiscount": 0.1
    }
  }'
