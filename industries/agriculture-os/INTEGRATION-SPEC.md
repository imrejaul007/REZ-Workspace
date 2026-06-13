# Agriculture OS Integration Specification

## Version 1.0 | June 2026

---

## Executive Summary

The Agriculture OS Integration Specification defines the technical architecture for connecting five core products (REZ Inventory, Distribution OS, Procurement OS, REZ QR Cloud, RABTUL Lending) with five specialized twins (Farm Twin, Crop Twin, Equipment Twin, Market Twin, Farmer Twin) through four intelligent agents (Crop Agent, Market Agent, Equipment Agent, Credit Agent).

The **Key Integration** is **REZ Inventory ↔ Farm Twin**, enabling real-time visibility into farm-level inventory, predictive consumption forecasting, and automated reorder triggering based on planting schedules, growth stages, and market conditions.

### Integration Philosophy

The Agriculture OS follows a **seasonal-planning** design where twins represent the lifecycle of agricultural operations:

1. **Production Loop**: Planting schedules → Crop Twin updates → Equipment Twin coordination → Harvest tracking
2. **Distribution Loop**: Harvest completion → Inventory updates → Market Twin pricing → Distribution OS routing
3. **Credit Loop**: Market prices → Credit Agent assessment → RABTUL Lending approval → Input procurement

### Business Outcomes

| Metric | Target | Timeline |
|--------|--------|----------|
| Inventory accuracy | 99.2% | Week 5 |
| Crop yield prediction accuracy | 91% | Week 6 |
| Market price response time | <2 hours | Week 5 |
| Loan approval time | <48 hours | Week 6 |
| Supply chain efficiency | 94% | Week 6 |
| Equipment utilization | 88% | Week 6 |

---

## Product Capability Matrix

### Product → Twin Communication Ports

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT CAPABILITY MATRIX                          │
├─────────────────┬───────────────────────────────────┬────────────────────────┤
│ Product         │ Core Capability                   │ Twin Ports (Out/In)   │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ Inventory   │ Input/output tracking             │ FarmTwin:5001          │
│                 │ - Seed inventory                   │ CropTwin:5012          │
│                 │ - Fertilizer tracking              │ EquipmentTwin:5034     │
│                 │ - Harvest storage                  │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ Distribution OS │ Logistics & fulfillment            │ MarketTwin:5045         │
│                 │ - Route optimization               │ FarmTwin:5001          │
│                 │ - Delivery tracking                │ CropTwin:5012          │
│                 │ - Cold chain monitoring           │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ Procurement OS  │ Supplier management                │ FarmTwin:5001          │
│                 │ - Purchase orders                   │ EquipmentTwin:5034     │
│                 │ - Contract farming                 │ MarketTwin:5045        │
│                 │ - Input sourcing                   │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ QR Cloud    │ Traceability & authentication      │ CropTwin:5012          │
│                 │ - Harvest QR codes                 │ FarmTwin:5001          │
│                 │ - Quality verification             │ MarketTwin:5045        │
│                 │ - Consumer engagement              │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ RABTUL Lending  │ Agricultural credit platform       │ FarmerTwin:5056        │
│                 │ - Loan origination                 │ FarmTwin:5001          │
│                 │ - Credit scoring                   │ MarketTwin:5045        │
│                 │ - Repayment tracking               │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ CRM         │ Farmer relationship management     │ FarmerTwin:TBD         │
│                 │ - Engagement campaigns            │ FarmTwin:5001          │
│                 │ - Retention tracking              │ CustomerTwin:TBD       │
│                 │ - Segment management              │                        │
└─────────────────┴───────────────────────────────────┴────────────────────────┘
```

### Port Definitions

| Port | Protocol | Format | Rate Limit | Auth |
|------|----------|--------|------------|------|
| 5001 | gRPC | Protobuf | 3K req/s | OAuth2 |
| 5012 | gRPC | Protobuf | 5K req/s | OAuth2 |
| 5034 | gRPC | Protobuf | 2K req/s | OAuth2 |
| 5045 | REST | JSON | 10K req/s | API Key |
| 5056 | REST | JSON | 2K req/s | OAuth2 |

### Product-Product Communication Matrix

```
              REZ Inventory   Distribution    Procurement     QR Cloud       RABTUL
              ────────────    ────────────     ────────────    ────────       ──────
REZ Inventory       ●              5001              5001           5012           5001
Distribution        5001               ●                -              -            -
Procurement         5001               -                ●              5012           5056
QR Cloud            5012               -               5012            ●              -
RABTUL             5001                -               5056              -             ●
```

---

## Twin JSON Schemas

### Core Schema Framework

All twins follow a consistent JSON schema structure:

```json
{
  "schema_version": "1.0",
  "id": "<unique-twin-id>",
  "type": "<twin-type>",
  "attributes": { ... },
  "relationships": [ ... ],
  "managing_agents": [ ... ],
  "audit": {
    "created_at": "ISO8601",
    "updated_at": "ISO8601",
    "version": "integer"
  }
}
```

---

### Farm Twin Schema

**Purpose**: Canonical representation of agricultural farms including land, infrastructure, seasonal planning, and operational state.

```json
{
  "schema_version": "1.0",
  "id": "farm:farm_sunrise_valley_2026",
  "type": "FARM_TWIN",
  "attributes": {
    "identity": {
      "farm_id": "farm_sunrise_valley_2026",
      "name": "Sunrise Valley Farm",
      "registration_number": "AG-REG-2024-45892",
      "owner_id": "farmer:rakesh_patel_001",
      "farm_type": "mixed_agriculture",
      "certifications": ["organic_certified", "gap_certified", "fair_trade"],
      "established_year": 2018
    },
    "location": {
      "address": "Village Sundarpur, District Agra, Uttar Pradesh 282001",
      "coordinates": {"lat": 27.1767, "lng": 78.0081},
      "total_area_hectares": 45.5,
      "cultivable_area_hectares": 38.2,
      "irrigated_area_hectares": 35.0,
      "soil_type": "alluvial",
      "soil_ph": 7.2,
      "climate_zone": "semi_arid_tropical"
    },
    "land_parcels": [
      {
        "parcel_id": "parcel_north_block",
        "area_hectares": 12.5,
        "soil_health": "good",
        "irrigation_type": "drip",
        "current_crop": "wheat_rabi",
        "planting_date": "2025-11-15",
        "expected_harvest": "2026-04-20",
        "status": "growing"
      },
      {
        "parcel_id": "parcel_south_block",
        "area_hectares": 15.0,
        "soil_health": "excellent",
        "irrigation_type": "flood",
        "current_crop": "sugarcane",
        "planting_date": "2025-03-10",
        "expected_harvest": "2026-03-15",
        "status": "near_harvest"
      },
      {
        "parcel_id": "parcel_east_block",
        "area_hectares": 10.7,
        "soil_health": "moderate",
        "irrigation_type": "sprinkler",
        "current_crop": "fallow",
        "next_planting": "2026-07-01",
        "status": "preparation"
      }
    ],
    "infrastructure": {
      "borewells": {"count": 3, "functional": 3, "avg_depth_meters": 85},
      "storage_capacity_tons": 250,
      "cold_storage_tons": 50,
      "farm_equipment": {
        "tractors": 2,
        "harvesters": 1,
        "sprayers": 3,
        "irrigation_systems": "automated_drip"
      },
      "electricity": {"source": "solar_grid", "backup": "diesel_generator"},
      "connectivity": {"internet": true, "cellular_coverage": "good"}
    },
    "seasonal_planning": {
      "current_season": "rabi",
      "season_name": "Rabi 2025-26",
      "planting_calendar": {
        "wheat": {"planted": "2025-11-15", "expected_harvest": "2026-04-20"},
        "mustard": {"planted": "2025-10-20", "expected_harvest": "2026-03-15"},
        "chickpea": {"planted": "2025-11-01", "expected_harvest": "2026-03-30"}
      },
      "input_requirements": {
        "seeds_kg": {"wheat": 400, "mustard": 50, "chickpea": 150},
        "fertilizer_tons": {"urea": 8, "dap": 4, "potash": 2},
        "pesticides_liters": {"herbicide": 50, "fungicide": 30, "insecticide": 40}
      }
    },
    "inventory_status": {
      "seeds": {
        "wheat": {"current_kg": 280, "required_kg": 400, "status": "low"},
        "mustard": {"current_kg": 35, "required_kg": 50, "status": "low"},
        "chickpea": {"current_kg": 120, "required_kg": 150, "status": "adequate"}
      },
      "fertilizers": {
        "urea": {"current_tons": 6.5, "required_tons": 8, "status": "low"},
        "dap": {"current_tons": 3.2, "required_tons": 4, "status": "adequate"},
        "potash": {"current_tons": 1.8, "required_tons": 2, "status": "adequate"}
      },
      "harvest_storage": {
        "current_tons": 45,
        "capacity_tons": 250,
        "cold_storage_tons": 28,
        "capacity_tons": 50
      }
    },
    "financial": {
      "season_budget": 2500000,
      "spent_to_date": 1450000,
      "projected_total": 2380000,
      "subsidies_received": 180000,
      "loan_outstanding": 750000
    }
  },
  "relationships": [
    {
      "type": "MANAGED_BY",
      "target_id": "farmer:rakesh_patel_001",
      "relationship": "primary_owner"
    },
    {
      "type": "PRODUCES",
      "target_id": "crop:crop_wheat_sunrise_2026",
      "area_hectares": 12.5,
      "expected_yield_tons": 42
    },
    {
      "type": "USES",
      "target_id": "equipment:eqp_tractor_kubota_01",
      "utilization_rate": 0.65
    },
    {
      "type": "STORES_AT",
      "target_id": "inventory:inv_sunrise_warehouse",
      "capacity_utilization": 0.72
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:crop_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_planning", "update_inventory"],
      "last_sync": "2026-06-12T14:30:00Z"
    },
    {
      "agent_id": "agent:market_agent",
      "role": "SECONDARY",
      "permissions": ["read"],
      "last_sync": "2026-06-12T14:25:00Z"
    },
    {
      "agent_id": "agent:equipment_agent",
      "role": "SECONDARY",
      "permissions": ["read", "update_schedule"],
      "last_sync": "2026-06-12T14:28:00Z"
    }
  ],
  "audit": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2026-06-12T14:30:00Z",
    "version": 3421,
    "change_log": [
      {
        "version": 3421,
        "timestamp": "2026-06-12T14:30:00Z",
        "agent": "crop_agent",
        "changes": ["inventory_updated", "planting_schedule_sync"]
      }
    ]
  }
}
```

---

### Crop Twin Schema

**Purpose**: Real-time representation of crops including growth stage, health metrics, yield projections, and market readiness.

```json
{
  "schema_version": "1.0",
  "id": "crop:crop_wheat_sunrise_2026",
  "type": "CROP_TWIN",
  "attributes": {
    "identity": {
      "crop_id": "crop_wheat_sunrise_2026",
      "variety": "HD-2967",
      "scientific_name": "Triticum aestivum",
      "season": "rabi_2025-26",
      "source": "certified_seed",
      "seed_lot": "LOT-2025-WH-45892"
    },
    "planting": {
      "farm_id": "farm_sunrise_valley_2026",
      "parcel_id": "parcel_north_block",
      "area_hectares": 12.5,
      "planting_date": "2025-11-15",
      "planting_method": "line_sowing",
      "seed_rate_kg_hectare": 100,
      "spacing_cm": {"row": 20, "plant": 5}
    },
    "growth": {
      "current_stage": "grain_filling",
      "stage_progress_percent": 75,
      "days_since_planting": 210,
      "expected_days_to_maturity": 155,
      "growth_rate_cm_day": 0.8,
      "plant_height_cm": 98,
      "canopy_closure_percent": 85,
      "stage_history": [
        {"stage": "germination", "completed": "2025-11-22", "duration_days": 7},
        {"stage": "seedling", "completed": "2025-12-15", "duration_days": 23},
        {"stage": "tillering", "completed": "2026-01-20", "duration_days": 36},
        {"stage": "jointing", "completed": "2026-02-25", "duration_days": 36},
        {"stage": "heading", "completed": "2026-03-15", "duration_days": 18},
        {"stage": "flowering", "completed": "2026-03-28", "duration_days": 13},
        {"stage": "grain_filling", "started": "2026-03-28", "in_progress": true}
      ]
    },
    "health": {
      "overall_health_score": 8.5,
      "ndvi_index": 0.78,
      "disease_pressure": "low",
      "pest_pressure": "moderate",
      "active_issues": [
        {
          "issue_id": "issue_001",
          "type": "rust_spotted",
          "severity": "minor",
          "affected_area_percent": 3,
          "treatment_applied": "fungicide_spray",
          "treatment_date": "2026-03-01"
        }
      ],
      "last_inspection": "2026-06-10",
      "next_scheduled_inspection": "2026-06-17"
    },
    "nutrition": {
      "nitrogen_status": "adequate",
      "phosphorus_status": "good",
      "potassium_status": "adequate",
      "last_fertilizer_application": "2026-02-15",
      "fertilizer_type": "urea_top_dressing",
      "next_fertilizer_needed": "2026-06-20",
      "water_stress": "none"
    },
    "weather_impact": {
      "frost_damage": false,
      "heat_stress_days": 4,
      "excess_rainfall_days": 2,
      "drought_stress_days": 0
    },
    "yield_projection": {
      "expected_yield_tons": 42,
      "yield_per_hectare_tons": 3.36,
      "confidence_percent": 85,
      "projection_basis": ["historical_avg", "current_ndvi", "growth_rate"],
      "quality_grade_expected": "A",
      "moisture_content_percent": 12.5,
      "test_weight_kg_hl": 78
    },
    "market_readiness": {
      "harvest_window_start": "2026-04-15",
      "harvest_window_end": "2026-04-25",
      "current_market_price_per_quintal": 2275,
      "forward_contract_available": true,
      "storage_options": ["on_farm", "mandi", "warehouse_receipt"]
    }
  },
  "relationships": [
    {
      "type": "GROWN_ON",
      "target_id": "farm:farm_sunrise_valley_2026",
      "parcel": "parcel_north_block"
    },
    {
      "type": "MONITORED_BY",
      "target_id": "farmer:rakesh_patel_001",
      "last_visit": "2026-06-10"
    },
    {
      "type": "TRACKED_BY",
      "target_id": "equipment:eqp_drone_survey_01",
      "last_survey": "2026-06-08"
    },
    {
      "type": "WILL_BE_SOLD_AT",
      "target_id": "market:mandi_agra_primary",
      "expected_volume_quintals": 420
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:crop_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_growth", "update_health"],
      "last_sync": "2026-06-12T14:32:00Z"
    },
    {
      "agent_id": "agent:market_agent",
      "role": "SECONDARY",
      "permissions": ["read", "update_market_readiness"],
      "last_sync": "2026-06-12T14:20:00Z"
    }
  ],
  "audit": {
    "created_at": "2025-11-15T06:00:00Z",
    "updated_at": "2026-06-12T14:32:00Z",
    "version": 1847,
    "change_log": []
  }
}
```

---

### Equipment Twin Schema

**Purpose**: Trackable representation of agricultural equipment including location, usage, maintenance, and utilization metrics.

```json
{
  "schema_version": "1.0",
  "id": "equipment:eqp_tractor_kubota_01",
  "type": "EQUIPMENT_TWIN",
  "attributes": {
    "identity": {
      "equipment_id": "eqp_tractor_kubota_01",
      "asset_tag": "AGR-EQP-TRC-001",
      "name": "Kubota M5072 72HP",
      "category": "tractor",
      "manufacturer": "Kubota",
      "model": "M5072",
      "serial_number": "KUB-2024-78945",
      "year": 2024,
      "purchase_date": "2024-02-01",
      "purchase_price": 1250000,
      "current_value": 1150000,
      "ownership": "owned"
    },
    "specifications": {
      "horsepower": 72,
      "fuel_type": "diesel",
      "fuel_capacity_liters": 70,
      "transmission": "hydrostatic",
      "pto_hp": 61,
      "hydraulic_flow_lpm": 64
    },
    "location": {
      "current_farm": "farm_sunrise_valley_2026",
      "parked_location": "equipment_shed_north",
      "coordinates": {"lat": 27.1769, "lng": 78.0085},
      "last_moved": "2026-06-11T16:30:00Z"
    },
    "usage": {
      "total_hours": 1245,
      "hours_this_month": 87,
      "hours_this_week": 18,
      "hours_today": 0,
      "utilization_rate": {
        "current": 0.65,
        "season_avg": 0.72,
        "idle_rate": 0.28
      },
      "common_operations": [
        {"operation": "plowing", "hours_percent": 35},
        {"operation": "tilling", "hours_percent": 25},
        {"operation": "spraying", "hours_percent": 20},
        {"operation": "transport", "hours_percent": 15},
        {"operation": "threshing", "hours_percent": 5}
      ]
    },
    "fuel": {
      "current_level_liters": 45,
      "fuel_capacity_liters": 70,
      "fuel_level_percent": 64,
      "avg_consumption_lhr": 8.5,
      "fuel_cost_this_month": 24500,
      "range_remaining_km": 180
    },
    "maintenance": {
      "next_service_hours": 1300,
      "hours_until_service": 55,
      "oil_change_due_hours": 100,
      "service_history": [
        {
          "date": "2026-04-01",
          "type": "routine_service",
          "hours_at_service": 1100,
          "cost": 8500,
          "description": "Oil change, filter replacement, general inspection"
        }
      ],
      "outstanding_issues": [],
      "overall_condition": "good"
    },
    "attachments": [
      {"type": "cultivator", "id": "att_cult_3row", "status": "attached"},
      {"type": "sprayer", "id": "att_spr_500l", "status": "stored"},
      {"type": "trailer", "id": "att_trl_3ton", "status": "attached"}
    ],
    "operator": {
      "primary_operator": "farmer:rakesh_patel_001",
      "certifications": ["tractor_operation_basic"],
      "hours_today": 0
    },
    "telemetry": {
      "engine_rpm": 0,
      "engine_hours": 1245,
      "oil_pressure_psi": 45,
      "coolant_temp_c": 85,
      "battery_voltage": 12.6,
      "error_codes": []
    }
  },
  "relationships": [
    {
      "type": "OWNED_BY",
      "target_id": "farm:farm_sunrise_valley_2026",
      "since": "2024-02-01"
    },
    {
      "type": "OPERATED_BY",
      "target_id": "farmer:rakesh_patel_001"
    },
    {
      "type": "SHARED_WITH",
      "target_id": "farm:farm_green_fields_co",
      "sharing_agreement": "custom_rate",
      "utilization_rate_shared": 0.15
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:equipment_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_location", "update_usage"],
      "last_sync": "2026-06-12T14:35:00Z"
    },
    {
      "agent_id": "agent:crop_agent",
      "role": "SECONDARY",
      "permissions": ["read"],
      "last_sync": "2026-06-12T14:30:00Z"
    }
  ],
  "audit": {
    "created_at": "2024-02-01T10:00:00Z",
    "updated_at": "2026-06-12T14:35:00Z",
    "version": 892,
    "change_log": []
  }
}
```

---

### Market Twin Schema

**Purpose**: Dynamic representation of agricultural markets including prices, demand signals, and trend analysis.

```json
{
  "schema_version": "1.0",
  "id": "market:mandi_agra_primary",
  "type": "MARKET_TWIN",
  "attributes": {
    "identity": {
      "market_id": "mandi_agra_primary",
      "name": "Agra Agricultural Produce Market Committee",
      "market_type": "mandi",
      "location": {
        "city": "Agra",
        "state": "Uttar Pradesh",
        "coordinates": {"lat": 27.1876, "lng": 78.0144}
      },
      "operating_hours": {"open": "06:00", "close": "18:00"},
      "operating_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    },
    "commodities": [
      {
        "commodity_id": "wheat",
        "name": "Wheat (FAQ Grade)",
        "current_price_per_quintal": 2275,
        "price_change_day": 15,
        "price_change_percent": 0.66,
        "arrivals_today_quintals": 1250,
        "demand": "moderate",
        "supply": "adequate",
        "price_trend_30d": "upward",
        "forecast_7d": {
          "min": 2250,
          "max": 2320,
          "expected": 2290
        }
      },
      {
        "commodity_id": "mustard",
        "name": "Mustard Seed",
        "current_price_per_quintal": 5850,
        "price_change_day": -25,
        "price_change_percent": -0.43,
        "arrivals_today_quintals": 320,
        "demand": "good",
        "supply": "tight",
        "price_trend_30d": "stable",
        "forecast_7d": {
          "min": 5800,
          "max": 5950,
          "expected": 5875
        }
      },
      {
        "commodity_id": "sugarcane",
        "name": "Sugarcane",
        "current_price_per_quintal": 350,
        "price_change_day": 0,
        "price_change_percent": 0,
        "arrivals_today_quintals": 8500,
        "demand": "strong",
        "supply": "plentiful",
        "price_trend_30d": "stable",
        "fixed_by_govt": true
      }
    ],
    "demand_signals": {
      "overall_market_sentiment": "bullish",
      "buyer_activity": "high",
      "seller_activity": "moderate",
      "inventory_held_by_traders": "below_normal",
      "expected_arrivals_7d": {
        "wheat": 8500,
        "mustard": 2100,
        "chickpea": 3200
      }
    },
    "logistics": {
      "avg_queue_time_minutes": 25,
      "quality_testing_capacity_per_hour": 150,
      "storage_available_tons": 500,
      "cold_storage_available_tons": 100,
      "transport_connections": ["rail", "road_nh44", "road_nh19"]
    },
    "trends": {
      "price_index_base": 100,
      "current_index": 112.5,
      "month_over_month_change": 3.2,
      "year_over_year_change": 8.7,
      "seasonal_index": {
        "current": "harvest_season_low",
        "expected_recovery": "2026-07-01"
      }
    },
    "regulatory": {
      " license_required": true,
      "grade_certification_available": true,
      "electronic_auction_enabled": true,
      "warehouse_receipts_accepted": true
    }
  },
  "relationships": [
    {
      "type": "TRADES",
      "target_id": "crop:crop_wheat_sunrise_2026",
      "volume_expected_quintals": 420,
      "price_locked": false
    },
    {
      "type": "SERVES",
      "target_id": "farm:farm_sunrise_valley_2026",
      "distance_km": 8.5
    },
    {
      "type": "CONNECTED_TO",
      "target_id": "distribution:dist_route_agra_delhi",
      "avg_transit_hours": 4
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:market_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_prices", "update_trends"],
      "last_sync": "2026-06-12T14:40:00Z"
    }
  ],
  "audit": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2026-06-12T14:40:00Z",
    "version": 8945,
    "change_log": []
  }
}
```

---

### Farmer Twin Schema

**Purpose**: Individual farmer profile including land holdings, credit history, skills, and social connections.

```json
{
  "schema_version": "1.0",
  "id": "farmer:rakesh_patel_001",
  "type": "FARMER_TWIN",
  "attributes": {
    "identity": {
      "farmer_id": "rakesh_patel_001",
      "first_name": "Rakesh",
      "last_name": "Patel",
      "father_name": "Suresh Patel",
      "date_of_birth": "1978-06-15",
      "aadhar_number_hash": "XXXX-XXXX-4521",
      "phone_primary": "+91-98765-43210",
      "alternate_phone": "+91-87654-32109",
      "photo_url": "https://cdn.rez.io/farmers/rp_001/photo.jpg",
      "literacy_level": "high_school"
    },
    "land_holdings": {
      "total_area_hectares": 45.5,
      "owned_hectares": 38.0,
      "leased_hectares": 7.5,
      "lease_expiry": "2028-03-31",
      "land_records_verified": true,
      "record_type": "digitized_cultivation_record"
    },
    "farming_profile": {
      "farming_experience_years": 22,
      "primary_occupation": "farming",
      "secondary_occupation": "agri_input_dealer",
      "farming_type": "mixed_cereal_horticulture",
      "irrigation_sources": ["borewell", "canal"],
      "main_crops": ["wheat", "sugarcane", "mustard", "chickpea"],
      "livestock": {"cows": 4, "buffalo": 2, "goats": 8}
    },
    "skills": {
      "mechanized_farming": true,
      "organic_farming": true,
      "precision_agriculture": "basic",
      "post_harvest_management": true,
      "financial_literacy": "intermediate",
      "digital_tool_usage": "intermediate"
    },
    "certifications": [
      {
        "name": "Organic Certification",
        "status": "active",
        "valid_until": "2027-06-30",
        "issuing_body": "FSSAI Organic"
      },
      {
        "name": "GAP Certificate",
        "status": "active",
        "valid_until": "2027-03-15",
        "issuing_body": "APEDA"
      }
    ],
    "financial_profile": {
      "annual_income_inr": 2800000,
      "income_sources": {
        "crop_sales": 0.65,
        "livestock": 0.15,
        "agri_services": 0.12,
        "other": 0.08
      },
      "monthly_expenses_inr": 180000,
      "bank_accounts": [
        {"bank": "State Bank of India", "account_type": "savings", "verified": true},
        {"bank": "Kisan Credit Card", "credit_limit": 200000, "used": 75000}
      ]
    },
    "credit": {
      "credit_score": 782,
      "credit_history_years": 12,
      "active_loans": [
        {
          "loan_id": "loan_tractor_2024",
          "lender": "KVB Bank",
          "principal_outstanding": 750000,
          "emi_inr": 28500,
          "next_payment_date": "2026-07-01",
          "status": "current"
        }
      ],
      "total_outstanding_inr": 750000,
      "loan_utilization_rate": 0.45,
      "default_history": "none"
    },
    "digital_engagement": {
      "app_installed": true,
      "app_version": "4.2.1",
      "last_active": "2026-06-12T14:30:00Z",
      "preferred_language": "hindi",
      "notification_preferences": {
        "price_alerts": true,
        "weather_alerts": true,
        "loan_reminders": true,
        "market_news": true
      },
      "transactions_this_month": 12,
      "qr_scans_this_month": 5
    },
    "social": {
      "farmer_group_member": true,
      "primary_group": "Sunrise Farmers Cooperative",
      "self_help_group": "Mahila Kisan Sangh",
      "extension_officer_contact": "+91-98765-11111",
      "peer_connections": ["farmer:amit_sharma_002", "farmer:priya_gupta_003"]
    }
  },
  "relationships": [
    {
      "type": "OWNS",
      "target_id": "farm:farm_sunrise_valley_2026",
      "ownership_percent": 100,
      "since": "2018-01-15"
    },
    {
      "type": "BORROWS_FROM",
      "target_id": "lender:kvb_bank",
      "outstanding": 750000,
      "status": "active"
    },
    {
      "type": "PARTNERED_WITH",
      "target_id": "distribution:dist_sunrise_logistics",
      "relationship": "preferred_seller"
    },
    {
      "type": "MEMBER_OF",
      "target_id": "coop:sunrise_farmers_coop",
      "member_since": "2019-06-01"
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:credit_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_credit"],
      "last_sync": "2026-06-12T14:20:00Z"
    },
    {
      "agent_id": "agent:market_agent",
      "role": "SECONDARY",
      "permissions": ["read"],
      "last_sync": "2026-06-12T14:25:00Z"
    }
  ],
  "audit": {
    "created_at": "2019-01-01T00:00:00Z",
    "updated_at": "2026-06-12T14:20:00Z",
    "version": 452,
    "change_log": []
  }
}
```

---

## Integration Flows with API Endpoints

### Flow 1: REZ Inventory ↔ Farm Twin (Key Integration)

**Purpose**: Real-time inventory synchronization enabling predictive reordering and consumption tracking.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ REZ Inventory   │────▶│   Farm Twin     │────▶│   Crop Agent    │
│                 │◀────│                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                      │                       │
       ▼                      ▼                       ▼
   POST /inventory        GET /twin/farm          PUT /twin/farm
   /consume               /{id}/inventory         /{id}/alerts
   /reorder               /sync                   /reorder_suggest
```

**API Endpoints**:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/inventory/consume` | Record input consumption | OAuth2 |
| GET | `/v1/inventory/stock/{farm_id}` | Get farm inventory | OAuth2 |
| POST | `/v1/inventory/reorder` | Trigger reorder | OAuth2 |
| GET | `/v1/twin/farm/{farm_id}/inventory` | Get farm inventory from twin | OAuth2 |
| PUT | `/v1/twin/farm/{farm_id}/sync` | Sync inventory state | OAuth2 |
| POST | `/v1/agent/crop/reorder-suggest` | Get reorder suggestions | OAuth2 |

**Request/Response Examples**:

```json
// POST /v1/inventory/consume
{
  "farm_id": "farm_sunrise_valley_2026",
  "item_type": "fertilizer",
  "item_id": "urea_bag_50kg",
  "quantity": 10,
  "unit": "bags",
  "parcel_id": "parcel_north_block",
  "crop_id": "crop_wheat_sunrise_2026",
  "recorded_by": "farmer:rakesh_patel_001",
  "timestamp": "2026-06-12T14:30:00Z",
  "application_method": "top_dressing",
  "weather_conditions": {
    "temperature_c": 32,
    "humidity_percent": 45,
    "wind_speed_kph": 8
  }
}

// Response
{
  "consumption_id": "con_f7g8h9i0j1k2",
  "farm_id": "farm_sunrise_valley_2026",
  "inventory_updated": true,
  "remaining_stock": {
    "urea_bag_50kg": {
      "previous": 65,
      "consumed": 10,
      "current": 55,
      "status": "low"
    }
  },
  "crop_twin_updated": true,
  "next_application_recommended": "2026-06-20",
  "projected_requirement": {
    "total_needed": 80,
    "current": 55,
    "deficit": 25,
    "recommended_order": 30
  }
}
```

**Reorder Automation Flow**:

```json
// Automatic reorder trigger when stock falls below threshold
{
  "trigger_event": "inventory_low",
  "farm_id": "farm_sunrise_valley_2026",
  "item": "urea_bag_50kg",
  "current_stock": 55,
  "threshold": 60,
  "seasonal_requirement": 80,
  "lead_time_days": 3,
  "auto_order_generated": true,
  "order": {
    "order_id": "ord_l5m6n7o8p9q0",
    "supplier": "sup_agri_inputs_co",
    "quantity": 30,
    "estimated_cost_inr": 42000,
    "expected_delivery": "2026-06-15",
    "approval_required": true,
    "farmer_notified": true
  }
}
```

---

### Flow 2: Market Agent → Market Twin → Distribution OS

**Purpose**: Real-time price synchronization and logistics coordination.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Market Agent    │────▶│   Market Twin   │────▶│  Distribution   │
│                 │     │                 │     │       OS        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**API Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/market/prices/{commodity}` | Get current commodity prices |
| GET | `/v1/market/forecast/{commodity}` | Get price forecast |
| POST | `/v1/distribution/route/calculate` | Calculate optimal route |
| POST | `/v1/distribution/booking` | Book transportation |
| GET | `/v1/twin/market/{market_id}/prices` | Get market prices from twin |

---

### Flow 3: Procurement OS → Farm Twin → RABTUL Lending

**Purpose**: Contract farming with integrated credit processing.

**API Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/procurement/contract` | Create procurement contract |
| GET | `/v1/procurement/contract/{id}` | Get contract details |
| POST | `/v1/twin/farm/{id}/credit-check` | Credit assessment request |
| GET | `/v1/lending/loan/{farmer_id}/status` | Get loan status |

---

### Flow 4: REZ QR Cloud → Crop Twin → Market Twin

**Purpose**: Traceability from harvest to market with quality verification.

**API Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/qr/harvest/generate` | Generate harvest QR code |
| GET | `/v1/qr/trace/{qr_id}` | Trace product journey |
| PUT | `/v1/twin/crop/{id}/quality` | Update quality assessment |
| POST | `/v1/market/quality-check` | Submit quality report |

---

## Agent Definitions

### Crop Agent

**Agent ID**: `agent:crop_agent`

**Purpose**: Comprehensive crop management including growth monitoring, yield prediction, and input optimization.

**Capabilities**:
- Growth stage tracking and prediction
- Yield estimation with confidence intervals
- Disease and pest detection integration
- Input optimization recommendations
- Harvest timing optimization
- Weather impact analysis

**Core Functions**:

```json
{
  "agent_id": "agent:crop_agent",
  "type": "CROP_AGENT",
  "version": "3.1.0",
  "capabilities": [
    "growth_tracking",
    "yield_prediction",
    "disease_detection",
    "input_optimization",
    "harvest_timing",
    "weather_integration"
  ],
  "configuration": {
    "yield_confidence_threshold": 0.85,
    "disease_detection_sensitivity": 0.80,
    "harvest_window_days": 7,
    "reorder_lead_time_days": 5
  },
  "managed_twins": [
    "crop:crop_*",
    "farm:farm_*"
  ],
  "integration_ports": {
    "farm_twin": 5001,
    "crop_twin": 5012,
    "inventory_api": 5001
  }
}
```

---

### Market Agent

**Agent ID**: `agent:market_agent`

**Purpose**: Agricultural market intelligence including price prediction, demand forecasting, and sales optimization.

**Capabilities**:
- Real-time price monitoring
- Price trend analysis and forecasting
- Demand prediction
- Optimal selling time recommendations
- Contract farming coordination
- Export opportunity identification

**Core Functions**:

```json
{
  "agent_id": "agent:market_agent",
  "type": "MARKET_AGENT",
  "version": "2.8.0",
  "capabilities": [
    "price_monitoring",
    "price_forecasting",
    "demand_prediction",
    "selling_optimization",
    "contract_management",
    "export_intelligence"
  ],
  "configuration": {
    "price_alert_threshold_percent": 3,
    "forecast_horizon_days": 14,
    "min_profit_margin_percent": 10,
    "price_lock_recommendation_threshold": 0.85
  },
  "managed_twins": [
    "market:mandi_*",
    "crop:crop_*"
  ],
  "integration_ports": {
    "market_twin": 5045,
    "crop_twin": 5012,
    "distribution_api": 5045
  }
}
```

---

### Equipment Agent

**Agent ID**: `agent:equipment_agent`

**Purpose**: Farm equipment optimization including scheduling, maintenance prediction, and utilization analysis.

**Capabilities**:
- Equipment scheduling across farms
- Maintenance prediction and alerts
- Utilization optimization
- Shared equipment coordination
- Fuel efficiency tracking
- Operator assignment optimization

**Core Functions**:

```json
{
  "agent_id": "agent:equipment_agent",
  "type": "EQUIPMENT_AGENT",
  "version": "2.4.0",
  "capabilities": [
    "equipment_scheduling",
    "maintenance_prediction",
    "utilization_optimization",
    "sharing_coordination",
    "fuel_tracking",
    "operator_assignment"
  ],
  "configuration": {
    "maintenance_alert_hours": 50,
    "utilization_target_percent": 75,
    "service_window_hours": 4,
    "shared_equipment_enabled": true
  },
  "managed_twins": [
    "equipment:eqp_*",
    "farm:farm_*"
  ],
  "integration_ports": {
    "equipment_twin": 5034,
    "farm_twin": 5001,
    "procurement_api": 5034
  }
}
```

---

### Credit Agent

**Agent ID**: `agent:credit_agent`

**Purpose**: Agricultural credit management including loan assessment, risk scoring, and repayment optimization.

**Capabilities**:
- Credit score calculation
- Loan eligibility assessment
- Risk profiling
- Loan product recommendations
- Repayment optimization
- Subsidy identification

**Core Functions**:

```json
{
  "agent_id": "agent:credit_agent",
  "type": "CREDIT_AGENT",
  "version": "2.2.0",
  "capabilities": [
    "credit_scoring",
    "loan_assessment",
    "risk_profiling",
    "product_recommendation",
    "repayment_optimization",
    "subsidy_matching"
  ],
  "configuration": {
    "min_credit_score": 650,
    "max_loan_to_income_ratio": 0.5,
    "default_risk_threshold": 0.2,
    "subsidy_auto_apply": true
  },
  "managed_twins": [
    "farmer:farmer_*",
    "farm:farm_*"
  ],
  "integration_ports": {
    "farmer_twin": 5056,
    "farm_twin": 5001,
    "rabtul_api": 5056
  }
}
```

---

### CRM Agent

**Agent ID**: `agent:crm_agent`

**Purpose**: Farmer relationship management, engagement campaigns, and retention strategies for agricultural operations.

**Capabilities**:
- Farmer profile management and enrichment
- Engagement campaign execution
- Loyalty program management
- Retention prediction and intervention
- Farm operation insights
- Market opportunity communication

**Core Functions**:

```json
{
  "agent_id": "agent:crm_agent",
  "type": "CUSTOMER_INTELLIGENCE",
  "version": "1.0.0",
  "capabilities": [
    "farmer_profile_management",
    "engagement_campaigns",
    "loyalty_management",
    "retention_prediction",
    "market_insights"
  ],
  "configuration": {
    "retention_alert_threshold": 0.7,
    "engagement_frequency_days": 30,
    "loyalty_tier_update_months": 6
  },
  "managed_twins": [
    "farmer:farmer_*",
    "farm:farm_*"
  ],
  "integration_ports": {
    "farmer_twin": 5056,
    "farm_twin": 5001,
    "rez_crm_api": "TBD"
  }
}
```

---

## Business Copilot Queries

### Query Category 1: Farm Operations

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "What's my current inventory status?" | STATUS | Inventory breakdown by item |
| "Show me all crops and their growth stages" | STATUS | Crop dashboard with stages |
| "What inputs do I need for next week?" | FORECAST | Input requirements with priorities |
| "When should I harvest my wheat?" | RECOMMEND | Optimal harvest window with rationale |

### Query Category 2: Financial & Credit

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "What's my current credit score?" | STATUS | Credit score with factors |
| "Am I eligible for a new loan?" | ASSESS | Eligibility with conditions |
| "What's my total outstanding debt?" | AGGREGATE | Debt summary by lender |
| "How can I improve my credit score?" | RECOMMEND | Actionable steps with impact |

### Query Category 3: Market Intelligence

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "What's the current wheat price?" | STATUS | Current price with trend |
| "When should I sell my mustard?" | RECOMMEND | Selling recommendation with forecast |
| "Compare prices across nearby mandis" | COMPARE | Price comparison table |
| "Will prices go up next week?" | PREDICT | Price forecast with confidence |

### Query Category 4: Equipment Management

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "When is my tractor's next service?" | STATUS | Maintenance schedule |
| "Show equipment utilization this month" | ANALYZE | Utilization report |
| "Can I share my harvester with neighbors?" | MATCH | Sharing opportunities |
| "What's my fuel consumption trend?" | TREND | Fuel efficiency analysis |

### Query Category 5: Season Planning

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "Plan inputs for kharif season" | PLAN | Input plan with costs |
| "What's my expected harvest revenue?" | CALCULATE | Revenue projection by crop |
| "Compare this season to last year" | COMPARE | Year-over-year analysis |
| "What subsidies am I eligible for?" | IDENTIFY | Subsidy matching report |

---

## Economic Integration

### Revenue Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REVENUE FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

PRODUCTION VALUE CHAIN                    CREDIT VALUE CHAIN
────────────────────────                   ──────────────────

┌──────────────┐                          ┌──────────────┐
│   Crop       │                          │   Credit     │
│   Output     │                          │   Access     │
└──────┬───────┘                          └──────┬───────┘
       │                                         │
       ▼                                         ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Market    │───▶│   Revenue    │◀───│   Input      │
│   Sales     │    │   Generated  │    │   Purchase   │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Profit     │
                    │   Margin    │
                    └──────────────┘
```

### Value Attribution

| Revenue Stream | Source | Attribution Method | Agent Responsible |
|----------------|--------|-------------------|------------------|
| Crop Sales | Market Twin | Direct to crop lot | Market Agent |
| Input Savings | REZ Inventory | Contract discounts | Crop Agent |
| Credit Access | RABTUL | Loan amount | Credit Agent |
| Equipment Sharing | Equipment Agent | Rental income | Equipment Agent |
| Subsidies | Government | Direct to farmer | Credit Agent |

### Economic KPIs

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| Cost of Production | Total inputs / output | <65% of revenue | Per season |
| Input Efficiency | Yield / input cost | +15% YoY | Per crop |
| Price Realization | Sale price / market avg | >105% | Per sale |
| Credit Utilization | Loans used / available | 40-60% | Per season |
| Equipment ROI | Revenue / equipment cost | >3x | Annual |
| Subsidy Capture | Subsidy received / eligible | 95% | Annual |

### Settlement Configuration

```json
{
  "settlement_config": {
    "currency": "INR",
    "payment_methods": ["upi", "bank_transfer", "cash"],
    "settlement_frequencies": {
      "input_purchases": "immediate",
      "crop_sales": "t+1",
      "equipment_sharing": "weekly",
      "loan_repayments": "monthly"
    },
    "transaction_fees": {
      "market_sales": 0.002,
      "loan_processing": 0.01,
      "equipment_rental": 0.05
    },
    " subsidy_processing": {
      "auto_apply": true,
      "disbursement_method": "bank_transfer",
      "disbursement_time": "t+3"
    }
  }
}
```

---

## 6-Week Implementation Roadmap

### Week 1: Foundation (Days 1-7)

**Objective**: Core infrastructure and twin schemas

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Twin schema validation | Platform Team | Validated schemas | None |
| OAuth2 authentication | Security Team | Auth service | None |
| Farm Twin CRUD API | Backend Team | `/v1/twin/farm/*` | Auth service |
| Crop Twin CRUD API | Backend Team | `/v1/twin/crop/*` | Auth service |
| Dev environment setup | DevOps | Docker compose | None |

**Success Criteria**:
- All schemas validate against JSON Schema draft-07
- Auth service handles 3K requests/minute
- API endpoints respond <100ms p99

### Week 2: Twin Synchronization (Days 8-14)

**Objective**: Bidirectional sync between REZ Inventory and Farm Twin

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Sync protocol implementation | Backend Team | Sync endpoints | Week 1 APIs |
| Inventory → Farm Twin sync | Backend Team | Consumption sync | Week 1 APIs |
| Reorder automation engine | Backend Team | Auto-reorder logic | Sync protocol |
| Unit tests | QA Team | 85% coverage | All above |
| Load testing prep | DevOps | Test scripts | Week 1 |

**Success Criteria**:
- Sync latency <2s for 99th percentile
- Reorder automation accuracy >95%
- Zero data loss in sync operations

### Week 3: Product Integration (Days 15-21)

**Objective**: Connect all 5 products to twin layer

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Distribution OS → Market Twin | Product Team | Route optimization | Market Twin API |
| Procurement OS → Farm Twin | Product Team | Order tracking | Farm Twin API |
| REZ QR Cloud → Crop Twin | Product Team | Traceability sync | Crop Twin API |
| RABTUL → Farmer Twin | Product Team | Credit integration | Farmer Twin API |
| End-to-end flow testing | QA Team | Test scenarios | All products |

**Success Criteria**:
- All 5 products integrated
- End-to-end flows <5s latency
- Monitoring operational

### Week 4: Agent Deployment (Days 22-28)

**Objective**: Deploy all 4 agents

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Crop Agent deployment | ML Team | Growth tracking | Week 1-2 |
| Market Agent deployment | ML Team | Price monitoring | Week 3 market |
| Equipment Agent deployment | Backend Team | Equipment optimization | Week 1 |
| Credit Agent deployment | ML Team | Credit scoring | Week 3 credit |

**Success Criteria**:
- All agents handling 2K requests/minute each
- Agent-to-agent communication <500ms
- Graceful degradation implemented

### Week 5: Business Intelligence (Days 29-35)

**Objective**: Business Copilot and analytics

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Natural language parser | NLP Team | Query understanding | Week 1-4 |
| Analytics pipeline | Data Team | Metrics computation | Twin data |
| Copilot response templates | Product Team | Answer generation | Query parser |
| Financial dashboard | BI Team | Revenue tracking | Market Agent |
| Inventory reports | Data Team | Stock reports | Crop Agent |

**Success Criteria**:
- Copilot handles 75% of query types
- Dashboard refreshes <10 minutes
- Reports auto-generated weekly

### Week 6: Optimization & Launch (Days 36-42)

**Objective**: Performance optimization and launch

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Load testing | DevOps | Scale-out configs | Week 1-4 |
| Performance tuning | Backend Team | <200ms p99 latency | Load testing |
| Security audit | Security Team | Security testing | All systems |
| Documentation | All Teams | Integration docs | All systems |
| Launch decision | Leadership | Launch checklist | All above |

**Success Criteria**:
- All SLAs met (99.9% uptime, <200ms latency)
- Zero critical security findings
- Team trained and ready

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| Twin | Canonical digital representation of a physical entity with synchronized state |
| Agent | Autonomous software system that manages and orchestrates twin interactions |
| Mandi | Agricultural produce market committee (India) |
| FAQ | Fair Average Quality - standard grain quality measure |
| NDVI | Normalized Difference Vegetation Index - crop health metric |
| RABTUL | REZ Agricultural Business Term Understanding Loan |
| QR Cloud | Quick Response code cloud for traceability |

---

## Appendix: API Rate Limits

| Endpoint Pattern | Limit | Window | Burst |
|-----------------|-------|--------|-------|
| `/v1/twin/farm/*` | 3,000 | per minute | 4,500 |
| `/v1/twin/crop/*` | 5,000 | per minute | 7,500 |
| `/v1/twin/equipment/*` | 2,000 | per minute | 3,000 |
| `/v1/twin/market/*` | 10,000 | per minute | 15,000 |
| `/v1/twin/farmer/*` | 2,000 | per minute | 3,000 |
| `/v1/agent/*` | 2,000 | per minute | 3,000 |
| `/v1/copilot/query` | 500 | per minute | 750 |

---

*Document Version: 1.0 | Last Updated: June 12, 2026*
