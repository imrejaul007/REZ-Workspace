# ReZ Rewards - Loyalty Program

Multi-tier loyalty and rewards system.

## Features

- [x] Points accumulation
- [x] Tier system (Bronze, Silver, Gold, Platinum)
- [x] Reward redemption
- [x] Referral codes
- [x] Analytics

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/loyalty/register` | POST | Register customer |
| `/loyalty/points/add` | POST | Add points for order |
| `/loyalty/redeem` | POST | Redeem reward |
| `/loyalty/customer/:shop/:customerId` | GET | Get customer info |
| `/loyalty/rewards/:shop` | GET | Get available rewards |
| `/loyalty/stats/:shop` | GET | Get loyalty stats |
