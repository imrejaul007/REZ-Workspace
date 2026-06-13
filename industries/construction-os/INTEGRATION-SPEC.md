# Construction OS Integration Specification

## Version 1.0 | June 2026

---

## Executive Summary

The Construction OS Integration Specification defines the technical architecture for connecting five core products (REZ POS, REZ Staff, REZ Inventory, REZ Business Copilot, Compliance Checker) with five specialized twins (Project Twin, Site Twin, Contractor Twin, Worker Twin, Equipment Twin) through four intelligent agents (Project Manager Agent, Safety Agent, Labor Agent, Cost Agent).

The **Key Integration** is **REZ Business Copilot ↔ Project Twin**, enabling natural language project oversight, predictive analytics, and intelligent resource allocation powered by real-time project state synchronization.

### Integration Philosophy

The Construction OS follows a **project-centric** design where the Project Twin serves as the central coordination hub. All other twins and products orbit the Project Twin, enabling:

1. **Cost Control Loop**: Inventory consumption → Equipment Twin updates → Cost Agent analysis → Budget variance alerts
2. **Safety Loop**: Worker biometrics → Worker Twin alerts → Safety Agent triggers → Site Twin lockdown
3. **Schedule Loop**: Task completion → Project Twin updates → Project Manager Agent predictions → Stakeholder notifications

### Business Outcomes

| Metric | Target | Timeline |
|--------|--------|----------|
| Budget variance detection | <4 hours | Week 5 |
| Safety incident response | <2 minutes | Week 6 |
| Labor efficiency improvement | 18% | Week 6 |
| Compliance pass rate | 98% | Week 5 |
| Equipment utilization | 87% | Week 6 |

---

## Product Capability Matrix

### Product → Twin Communication Ports

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT CAPABILITY MATRIX                          │
├─────────────────┬───────────────────────────────────┬────────────────────────┤
│ Product         │ Core Capability                   │ Twin Ports (Out/In)   │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ POS         │ Point-of-sale & invoicing         │ ProjectTwin:4001        │
│                 │ - Material purchases              │ ContractorTwin:4023     │
│                 │ - Client payments                 │ EquipmentTwin:4034     │
│                 │ - Expense tracking                │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ Staff       │ Workforce management              │ WorkerTwin:4045         │
│                 │ - Scheduling                       │ SiteTwin:4022          │
│                 │ - Time tracking                    │ ProjectTwin:4001       │
│                 │ - Certification management        │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ Inventory   │ Material & equipment tracking      │ ProjectTwin:4001        │
│                 │ - Stock levels                     │ EquipmentTwin:4034     │
│                 │ - Reorder triggers                 │ SiteTwin:4022          │
│                 │ - Delivery scheduling              │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ Business    │ AI-powered analytics               │ ProjectTwin:4001        │
│ Copilot         │ - Natural language queries         │ All Twins:multi-port   │
│                 │ - Predictive insights              │                        │
│                 │ - Report generation               │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ Compliance      │ Regulatory compliance checking     │ SiteTwin:4022          │
│ Checker         │ - Permit tracking                  │ WorkerTwin:4045        │
│                 │ - Safety standards                 │ ProjectTwin:4001       │
│                 │ - Inspection scheduling            │                        │
├─────────────────┼───────────────────────────────────┼────────────────────────┤
│ REZ CRM         │ Customer relationship management   │ CustomerTwin:TBD        │
│                 │ - Client engagement               │ TransactionTwin:TBD    │
│                 │ - Campaign management             │ ProjectTwin:4001       │
│                 │ - Retention tracking               │                        │
└─────────────────┴───────────────────────────────────┴────────────────────────┘
```

### Port Definitions

| Port | Protocol | Format | Rate Limit | Auth |
|------|----------|--------|------------|------|
| 4001 | gRPC | Protobuf | 5K req/s | OAuth2 |
| 4022 | gRPC | Protobuf | 3K req/s | OAuth2 |
| 4023 | REST | JSON | 2K req/s | API Key |
| 4034 | gRPC | Protobuf | 2K req/s | OAuth2 |
| 4045 | gRPC | Protobuf | 5K req/s | OAuth2 |

### Product-Product Communication Matrix

```
              REZ POS        REZ Staff       REZ Inventory    Copilot       Compliance
              ──────────     ───────────     ─────────────    ───────       ──────────
REZ POS           ●              -               4001           4001            -
REZ Staff         -               ●               4045           4001            4045
REZ Inventory     4001            -                ●              4001           4022
Copilot           4001           4001              4001            ●            4001
Compliance        -              4045             4022             4001            ●
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

### Project Twin Schema

**Purpose**: Canonical representation of construction projects including scope, budget, schedule, and stakeholder alignment.

```json
{
  "schema_version": "1.0",
  "id": "project:prj_midtown_tower_2026",
  "type": "PROJECT_TWIN",
  "attributes": {
    "identity": {
      "project_id": "prj_midtown_tower_2026",
      "name": "Midtown Tower Phase 2",
      "client": "Apex Development Corp",
      "project_type": "commercial_highrise",
      "address": {
        "street": "1250 Commerce Boulevard",
        "city": "Austin",
        "state": "TX",
        "zip": "78701"
      },
      "start_date": "2026-01-15",
      "target_completion": "2027-06-30",
      "contract_value": 45000000
    },
    "scope": {
      "total_floors": 32,
      "floors_completed": 14,
      "sq_footage": {
        "total": 485000,
        "completed": 212000
      },
      "key_milestones": [
        {
          "name": "Foundation Complete",
          "target_date": "2026-03-01",
          "actual_date": "2026-02-28",
          "status": "completed"
        },
        {
          "name": "Structural Steel Complete",
          "target_date": "2026-08-15",
          "days_remaining": 65,
          "status": "on_track"
        },
        {
          "name": "MEP Rough-In Complete",
          "target_date": "2026-12-01",
          "days_remaining": 173,
          "status": "at_risk"
        }
      ]
    },
    "budget": {
      "total_contract_value": 45000000,
      "allocated": 21800000,
      "spent": 19750000,
      "forecasted_total": 46200000,
      "variance": 1200000,
      "variance_percentage": 2.67,
      "cost_breakdown": {
        "labor": {"allocated": 8500000, "spent": 7890000},
        "materials": {"allocated": 12000000, "spent": 10450000},
        "equipment": {"allocated": 3500000, "spent": 3210000},
        "subcontractors": {"allocated": 8500000, "spent": 7100000},
        "contingency": {"allocated": 2250000, "spent": 1100000}
      },
      "cost_per_sqft": {
        "budgeted": 92.78,
        "actual": 93.16,
        "forecasted": 95.26
      }
    },
    "schedule": {
      "baseline_duration_days": 532,
      "elapsed_days": 179,
      "remaining_days": 353,
      "percent_complete": 33.6,
      "schedule_performance_index": 0.97,
      "critical_path_items": [
        "Elevator shaft construction",
        "HVAC installation floor 15-20",
        "Fire suppression system"
      ],
      "delays": [
        {
          "task": "Curtain wall installation",
          "delay_days": 5,
          "cause": "material_supply_chain",
          "impact": "moderate"
        }
      ]
    },
    "quality": {
      "inspection_pass_rate": 0.97,
      "punch_list_items": {
        "open": 34,
        "resolved": 187
      },
      "change_orders": {
        "count": 12,
        "total_value": 485000,
        "pending_approval": 3
      }
    },
    "risk": {
      "overall_risk_score": 0.32,
      "risk_categories": {
        "supply_chain": 0.45,
        "weather": 0.28,
        "labor": 0.35,
        "regulatory": 0.22
      },
      "active_mitigations": [
        {
          "risk": "Curtain wall delay",
          "mitigation": "Secondary supplier contracted",
          "status": "executed"
        }
      ]
    }
  },
  "relationships": [
    {
      "type": "HAS_SITE",
      "target_id": "site:site_midtown_main",
      "location": {"lat": 30.2672, "lng": -97.7431},
      "area_sqft": 15000
    },
    {
      "type": "EMPOYS",
      "target_id": "worker:wrk_crew_alpha",
      "role": "general_contractor",
      "head_count": 45
    },
    {
      "type": "CONTRACTS",
      "target_id": "contractor:ctr_mech_solutions",
      "scope": "HVAC installation",
      "contract_value": 3200000
    },
    {
      "type": "USES",
      "target_id": "equipment:eqp_crane_fleet_01",
      "assignment": "primary_lift",
      "utilization_rate": 0.78
    },
    {
      "type": "CONSUMES",
      "target_id": "inventory:inv_concrete_midtown",
      "weekly_consumption": 450,
      "unit": "cubic_yards"
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:project_manager",
      "role": "PRIMARY",
      "permissions": ["read", "update_schedule", "update_budget"],
      "last_sync": "2026-06-12T14:30:00Z"
    },
    {
      "agent_id": "agent:cost_agent",
      "role": "SECONDARY",
      "permissions": ["read", "update_budget", "update_forecast"],
      "last_sync": "2026-06-12T14:25:00Z"
    },
    {
      "agent_id": "agent:safety_agent",
      "role": "SECONDARY",
      "permissions": ["read"],
      "last_sync": "2026-06-12T14:28:00Z"
    }
  ],
  "audit": {
    "created_at": "2026-01-10T08:00:00Z",
    "updated_at": "2026-06-12T14:30:00Z",
    "version": 4521,
    "change_log": [
      {
        "version": 4521,
        "timestamp": "2026-06-12T14:30:00Z",
        "agent": "project_manager",
        "changes": ["milestone_progress_updated", "budget_forecast_refreshed"]
      }
    ]
  }
}
```

---

### Site Twin Schema

**Purpose**: Real-time representation of construction sites including environmental conditions, access control, and spatial tracking.

```json
{
  "schema_version": "1.0",
  "id": "site:site_midtown_main",
  "type": "SITE_TWIN",
  "attributes": {
    "location": {
      "site_id": "site_midtown_main",
      "name": "Midtown Tower Main Site",
      "address": "1250 Commerce Boulevard, Austin, TX 78701",
      "coordinates": {"lat": 30.2672, "lng": -97.7431},
      "geofence": {
        "polygon": [...],
        "checkpoints": 8
      }
    },
    "environment": {
      "current_conditions": {
        "temperature_f": 89,
        "humidity_percent": 65,
        "wind_speed_mph": 12,
        "air_quality_index": 42,
        "uv_index": 9
      },
      "weather_alerts": [],
      "noise_level_db": 72,
      "dust_level": "moderate"
    },
    "access": {
      "active_workers": 127,
      "max_capacity": 200,
      "checkpoints": {
        "main_entrance": {"in_today": 145, "out_today": 23},
        "material_gate": {"deliveries_today": 8},
        "equipment_yard": {"in_today": 12, "out_today": 8}
      },
      "visitor_log": {
        "inspectors_today": 2,
        "clients_today": 1,
        "vendors_today": 5
      }
    },
    "zones": [
      {
        "zone_id": "zone_foundation",
        "name": "Foundation Work Zone",
        "status": "completed",
        "active_workers": 0
      },
      {
        "zone_id": "zone_structural",
        "name": "Structural Work - Floors 1-14",
        "status": "active",
        "active_workers": 89
      },
      {
        "zone_id": "zone_mechanical",
        "name": "MEP Rough-In - Floors 8-12",
        "status": "active",
        "active_workers": 38
      }
    ],
    "safety": {
      "safety_score": 94,
      "days_since_incident": 47,
      "near_miss_reports_today": 2,
      "active_hazards": [
        {
          "hazard_id": "haz_001",
          "type": "fall_risk",
          "location": "Floor 14 northwest corner",
          "severity": "medium",
          "mitigated": false
        }
      ],
      "ppe_compliance_rate": 0.98,
      "safety_meetings_completed_today": 3
    },
    "logistics": {
      "material_staging_areas": {
        "north_staging": {"utilization": 0.78, "capacity": 50},
        "south_staging": {"utilization": 0.45, "capacity": 50}
      },
      "parking_utilization": 0.89,
      "equipment_queued": 4
    }
  },
  "relationships": [
    {
      "type": "HOUSES",
      "target_id": "project:prj_midtown_tower_2026",
      "primary_site": true
    },
    {
      "type": "MONITORS",
      "target_id": "worker:wrk_crew_alpha",
      "active_on_site": 42
    },
    {
      "type": "STORES",
      "target_id": "equipment:eqp_crane_fleet_01",
      "status": "deployed"
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:safety_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_safety", "update_access"],
      "last_sync": "2026-06-12T14:35:00Z"
    },
    {
      "agent_id": "agent:labor_agent",
      "role": "SECONDARY",
      "permissions": ["read", "update_access"],
      "last_sync": "2026-06-12T14:32:00Z"
    }
  ],
  "audit": {
    "created_at": "2026-01-15T06:00:00Z",
    "updated_at": "2026-06-12T14:35:00Z",
    "version": 8934,
    "change_log": []
  }
}
```

---

### Contractor Twin Schema

**Purpose**: Representation of subcontractor entities including performance history, certifications, and contractual terms.

```json
{
  "schema_version": "1.0",
  "id": "contractor:ctr_mech_solutions",
  "type": "CONTRACTOR_TWIN",
  "attributes": {
    "business": {
      "contractor_id": "ctr_mech_solutions",
      "company_name": "MechSolutions HVAC Inc.",
      "trade": "HVAC Mechanical",
      "license_number": "TX-HVAC-45892",
      "years_in_business": 23,
      "headquarters": "Houston, TX",
      "bonding_capacity": 5000000,
      "insurance": {
        "liability": 2000000,
        "workers_comp": "current",
        "umbrella": 5000000
      }
    },
    "performance": {
      "rating": 4.7,
      "total_projects_completed": 127,
      "on_time_delivery_rate": 0.94,
      "on_budget_rate": 0.89,
      "quality_score": 4.8,
      "safety_record": {
        "incident_rate": 1.2,
        "industry_average": 2.8,
        "osha_violations_5yr": 0
      },
      "references": {
        "available": 15,
        "last_verified": "2026-03-15"
      }
    },
    "certifications": [
      {
        "name": "OSHA 30-Hour Construction",
        "count": 45,
        "expiry_dates_checked": true
      },
      {
        "name": "EPA 608 Universal",
        "count": 28,
        "expiry_dates_checked": true
      },
      {
        "name": "NATE Certified",
        "count": 15,
        "expiry_dates_checked": true
      }
    ],
    "financial": {
      "payment_terms": "net_30",
      "average_days_to_pay": 28,
      "credit_limit": 500000,
      "current_outstanding": 234000,
      "payment_history_score": 0.96
    },
    "current_workload": {
      "active_contracts": 4,
      "total_contract_value": 8400000,
      "available_capacity_percent": 35,
      "next_availability": "2026-08-01"
    }
  },
  "relationships": [
    {
      "type": "WORKS_ON",
      "target_id": "project:prj_midtown_tower_2026",
      "contract_value": 3200000,
      "percent_complete": 42,
      "status": "active"
    },
    {
      "type": "SUPERVISED_BY",
      "target_id": "worker:wrk_supervisor_jones",
      "contact": "Mike Jones",
      "phone": "+1-512-555-0142"
    },
    {
      "type": "EMPLOYS",
      "target_id": "worker:wrk_hvac_crew",
      "assigned_count": 12
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:project_manager",
      "role": "PRIMARY",
      "permissions": ["read", "update_contract"],
      "last_sync": "2026-06-12T14:20:00Z"
    },
    {
      "agent_id": "agent:labor_agent",
      "role": "SECONDARY",
      "permissions": ["read"],
      "last_sync": "2026-06-12T14:15:00Z"
    }
  ],
  "audit": {
    "created_at": "2024-06-01T00:00:00Z",
    "updated_at": "2026-06-12T14:20:00Z",
    "version": 342,
    "change_log": []
  }
}
```

---

### Worker Twin Schema

**Purpose**: Individual worker profile including certifications, skills, biometric data, and performance history.

```json
{
  "schema_version": "1.0",
  "id": "worker:wrk_miguel_rodriguez_457",
  "type": "WORKER_TWIN",
  "attributes": {
    "identity": {
      "worker_id": "wrk_miguel_rodriguez_457",
      "first_name": "Miguel",
      "last_name": "Rodriguez",
      "ssn_last_four": "4589",
      "date_of_birth": "1988-04-15",
      "photo_url": "https://cdn.rez.io/workers/wrk_457/photo.jpg",
      "employee_type": "hourly",
      "hire_date": "2024-03-10"
    },
    "employment": {
      "employer": "MechSolutions HVAC Inc.",
      "contractor_id": "ctr_mech_solutions",
      "current_project": "prj_midtown_tower_2026",
      "current_zone": "zone_mechanical",
      "role": "HVAC Sheet Metal Installer",
      "pay_rate": 38.50,
      "pay_type": "hourly",
      "shift": "day",
      "seniority_years": 2.3
    },
    "certifications": [
      {
        "cert_id": "cert_osha30",
        "name": "OSHA 30-Hour Construction",
        "issue_date": "2024-01-15",
        "expiry_date": "2029-01-15",
        "status": "valid"
      },
      {
        "cert_id": "cert_epa608",
        "name": "EPA 608 Universal Technician",
        "issue_date": "2023-06-20",
        "expiry_date": null,
        "status": "valid"
      },
      {
        "cert_id": "cert_nate_rig",
        "name": "NATE Certified - Commercial Refrigeration",
        "issue_date": "2025-09-10",
        "expiry_date": "2028-09-10",
        "status": "valid"
      }
    ],
    "skills": {
      "primary_trade": "hvac_sheet_metal",
      "secondary_trades": ["plumbing_basic", "electrical_basic"],
      "equipment_operated": ["forklift", "sheet_metal_break", "plasma_cutter"],
      "language_proficiency": {
        "english": "fluent",
        "spanish": "native"
      },
      "certification_level": "journeyman"
    },
    "biometrics": {
      "heart_rate_bpm": 72,
      "body_temperature_f": 98.6,
      "fatigue_score": 0.12,
      "hydration_index": 0.85,
      "last_break": "2026-06-12T11:30:00Z",
      "hours_worked_today": 6.5,
      "overtime_today": 0
    },
    "safety": {
      "safety_score": 96,
      "incidents_lifetime": 0,
      "near_misses_reported": 7,
      "safety_training_hours": 24,
      "last_drug_test": "2026-01-05",
      "ppe_compliance": {
        "rate": 0.99,
        "last_violation": null
      }
    },
    "performance": {
      "productivity_index": 1.15,
      "quality_rating": 4.6,
      "attendance_rate": 0.97,
      "tasks_completed_this_week": 18,
      "avg_task_duration_hours": 4.2
    },
    "location": {
      "current_zone": "zone_mechanical",
      "check_in_time": "2026-06-12T07:00:00Z",
      "last_position": {"x": 45.2, "y": 78.8, "floor": 10},
      "geofence_status": "inside_site"
    }
  },
  "relationships": [
    {
      "type": "WORKS_FOR",
      "target_id": "contractor:ctr_mech_solutions",
      "relationship": "direct_employee"
    },
    {
      "type": "ASSIGNED_TO",
      "target_id": "project:prj_midtown_tower_2026",
      "since": "2026-02-01"
    },
    {
      "type": "LOCATED_AT",
      "target_id": "site:site_midtown_main",
      "current": true
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:labor_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_location", "update_biometrics"],
      "last_sync": "2026-06-12T14:38:00Z"
    },
    {
      "agent_id": "agent:safety_agent",
      "role": "SECONDARY",
      "permissions": ["read", "update_safety"],
      "last_sync": "2026-06-12T14:35:00Z"
    }
  ],
  "audit": {
    "created_at": "2024-03-10T08:00:00Z",
    "updated_at": "2026-06-12T14:38:00Z",
    "version": 1847,
    "change_log": []
  }
}
```

---

### Equipment Twin Schema

**Purpose**: Trackable representation of construction equipment including location, usage, maintenance, and utilization metrics.

```json
{
  "schema_version": "1.0",
  "id": "equipment:eqp_crane_tower_01",
  "type": "EQUIPMENT_TWIN",
  "attributes": {
    "identity": {
      "equipment_id": "eqp_crane_tower_01",
      "asset_tag": "AST-MTL-CRANE-001",
      "name": "Liebherr 280 EC-H 12",
      "category": "tower_crane",
      "manufacturer": "Liebherr",
      "model": "280 EC-H 12",
      "serial_number": "LH-2024-45892",
      "year": 2024,
      "purchase_date": "2024-02-15",
      "purchase_price": 1850000,
      "current_value": 1720000
    },
    "location": {
      "current_site": "site_midtown_main",
      "current_position": {
        "x": 120.5,
        "y": 85.2,
        "z": 180,
        "jib_angle": 245,
        "slew_angle": 180
      },
      "operating_floor": 14,
      "last_moved": "2026-06-12T08:30:00Z"
    },
    "usage": {
      "total_hours": 2456,
      "hours_this_month": 187,
      "hours_this_week": 42,
      "hours_today": 7.5,
      "utilization_rate": {
        "current": 0.78,
        "weekly_avg": 0.72,
        "monthly_avg": 0.68
      },
      "idle_time_today_hours": 0.5,
      "maintenance_window_hours": 200
    },
    "load": {
      "current_load_tons": 8.5,
      "max_capacity_tons": 12,
      "load_utilization_percent": 70.8,
      "lifts_today": 14,
      "avg_lift_weight_tons": 6.2,
      "heaviest_lift_today": 11.2
    },
    "operator": {
      "assigned_operator": "wrk_marcus_thompson_892",
      "operator_certification": "cdl_class_a",
      "crane_certification": "tower_crane_t",
      "shift": "day",
      "hours_today": 7.5
    },
    "maintenance": {
      "next_scheduled": "2026-06-25",
      "hours_until_service": 44,
      "maintenance_history": [
        {
          "date": "2026-04-15",
          "type": "preventive",
          "description": "Hydraulic system inspection",
          "cost": 2500,
          "technician": "TechPro Services"
        }
      ],
      "outstanding_issues": [],
      "overall_condition": "excellent"
    },
    "telemetry": {
      "engine_hours": 2456,
      "fuel_level_percent": 85,
      "oil_pressure_psi": 42,
      "hydraulic_pressure_psi": 2850,
      "wind_speed_max_safe_mph": 45,
      "current_wind_speed_mph": 12,
      "temperature_hydraulic_f": 165
    },
    "safety": {
      "last_inspection": "2026-06-01",
      "inspection_status": "passed",
      "load_test_date": "2024-02-20",
      "load_test_result": "passed",
      "outage_incidents": 0
    }
  },
  "relationships": [
    {
      "type": "DEPLOYED_AT",
      "target_id": "site:site_midtown_main",
      "since": "2026-02-01",
      "assignment": "primary_lift"
    },
    {
      "type": "USED_BY",
      "target_id": "project:prj_midtown_tower_2026",
      "utilization_rate": 0.78
    },
    {
      "type": "OPERATED_BY",
      "target_id": "worker:wrk_marcus_thompson_892"
    }
  ],
  "managing_agents": [
    {
      "agent_id": "agent:labor_agent",
      "role": "PRIMARY",
      "permissions": ["read", "update_location", "update_usage"],
      "last_sync": "2026-06-12T14:36:00Z"
    },
    {
      "agent_id": "agent:project_manager",
      "role": "SECONDARY",
      "permissions": ["read"],
      "last_sync": "2026-06-12T14:30:00Z"
    }
  ],
  "audit": {
    "created_at": "2024-02-15T10:00:00Z",
    "updated_at": "2026-06-12T14:36:00Z",
    "version": 3421,
    "change_log": []
  }
}
```

---

## Integration Flows with API Endpoints

### Flow 1: REZ Business Copilot → Project Twin (Key Integration)

**Purpose**: Natural language project oversight with real-time state synchronization.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ REZ Business    │────▶│   Project       │────▶│   Cost Agent    │
│ Copilot         │     │ Twin            │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │                       │
         ▼                      ▼                       ▼
   POST /copilot           GET /twin/project        PUT /twin/project
   /query                  /{id}/status             /{id}/forecast
```

**API Endpoints**:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/copilot/query` | Natural language query processing | OAuth2 |
| GET | `/v1/twin/project/{project_id}` | Get full project state | OAuth2 |
| GET | `/v1/twin/project/{project_id}/status` | Get project status summary | OAuth2 |
| GET | `/v1/twin/project/{project_id}/forecast` | Get project forecast | OAuth2 |
| PUT | `/v1/twin/project/{project_id}/alerts` | Update alert preferences | OAuth2 |
| POST | `/v1/agent/cost/analyze` | Trigger cost analysis | OAuth2 |

**Query Processing Flow**:

```json
// POST /v1/copilot/query
{
  "query": "What's our current budget variance and predicted final cost?",
  "project_id": "prj_midtown_tower_2026",
  "context": {
    "user_role": "project_manager",
    "preferred_response_format": "detailed"
  },
  "include_raw_data": true
}

// Response
{
  "query_id": "qry_x9k2l3m4n5o6",
  "intent": "budget_analysis",
  "entities_extracted": {
    "project": "prj_midtown_tower_2026",
    "metric": "budget_variance"
  },
  "answer": {
    "text": "Current budget variance is +$1.2M (2.67% over) against the $45M contract. The predicted final cost is $46.2M, representing a +$1.2M variance from contract value. Primary drivers: material cost increases (+$450K) and labor overtime (+$380K).",
    "confidence": 0.94,
    "sources": [
      "project_twin.budget.variance",
      "cost_agent.forecast"
    ],
    "raw_data": {
      "contract_value": 45000000,
      "forecasted_total": 46200000,
      "variance": 1200000,
      "variance_percentage": 2.67
    }
  },
  "suggested_actions": [
    {
      "action": "initiate_change_order",
      "description": "Submit change order for approved scope changes",
      "estimated_impact": "-$200000"
    },
    {
      "action": "review_material_contracts",
      "description": "Renegotiate remaining material deliveries",
      "estimated_impact": "-$150000"
    }
  ]
}
```

**Data Retrieval Patterns**:

| Query Type | Twin Accessed | Cached TTL | Freshness |
|------------|---------------|------------|-----------|
| Budget status | Project Twin | 5 min | Real-time |
| Schedule progress | Project Twin | 15 min | Daily sync |
| Worker counts | Site Twin | 1 min | Real-time |
| Equipment status | Equipment Twin | 5 min | Near real-time |
| Cost forecasts | Cost Agent | 30 min | Hourly |

---

### Flow 2: Compliance Checker → Site Twin → Worker Twin

**Purpose**: Automated compliance verification and certification tracking.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Compliance      │────▶│   Site Twin     │────▶│   Worker Twin   │
│ Checker         │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**API Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/compliance/check/site/{site_id}` | Full site compliance check |
| GET | `/v1/compliance/worker/{worker_id}/certifications` | Worker cert verification |
| POST | `/v1/compliance/inspection/schedule` | Schedule inspection |
| GET | `/v1/compliance/permits/{project_id}` | Get permit status |
| PUT | `/v1/twin/site/{site_id}/safety` | Update site safety metrics |

**Request/Response**:

```json
// POST /v1/compliance/check/site/site_midtown_main
{
  "check_types": [
    "worker_certifications",
    "ppe_compliance",
    "equipment_inspection",
    "permit_validity",
    "safety_protocols"
  ],
  "include_workers": true,
  "fail_threshold": "critical_only"
}

// Response
{
  "check_id": "chk_p7q8r9s0t1u2",
  "overall_status": "pass",
  "warnings": 2,
  "critical_failures": 0,
  "results": [
    {
      "check_type": "worker_certifications",
      "status": "pass",
      "checked": 127,
      "failures": 0,
      "expiring_soon": 5
    },
    {
      "check_type": "ppe_compliance",
      "status": "pass",
      "compliance_rate": 0.98,
      "failures": [
        {
          "worker_id": "wrk_temp_023",
          "violation": "missing_safety_glasses",
          "timestamp": "2026-06-12T14:15:00Z"
        }
      ]
    }
  ]
}
```

---

### Flow 3: REZ Inventory → Project Twin → Equipment Twin

**Purpose**: Material tracking and resource optimization across projects.

**API Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/inventory/consume` | Record material consumption |
| GET | `/v1/inventory/stock/{site_id}` | Get site inventory levels |
| POST | `/v1/inventory/reorder` | Trigger reorder alert |
| PUT | `/v1/twin/project/{id}/consumption` | Update project consumption |
| GET | `/v1/twin/equipment/{id}/utilization` | Get equipment utilization |

**Request/Response**:

```json
// POST /v1/inventory/consume
{
  "material_id": "mat_concrete_5000psi",
  "project_id": "prj_midtown_tower_2026",
  "quantity": 45,
  "unit": "cubic_yards",
  "location": {
    "site_id": "site_midtown_main",
    "zone": "zone_structural",
    "floor": 14
  },
  "recorded_by": "wrk_miguel_rodriguez_457",
  "timestamp": "2026-06-12T14:30:00Z"
}

// Response
{
  "consumption_id": "con_v5w6x7y8z9a0",
  "remaining_stock": 312,
  "reorder_status": "adequate",
  "project_updated": true,
  "cost_recorded": {
    "unit_cost": 142.50,
    "total_cost": 6412.50,
    "budget_category": "materials"
  }
}
```

---

### Flow 4: REZ Staff → Worker Twin → Site Twin

**Purpose**: Workforce management with real-time location and safety monitoring.

**API Endpoints**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/staff/checkin` | Worker check-in |
| POST | `/v1/staff/checkout` | Worker check-out |
| PUT | `/v1/twin/worker/{id}/location` | Update worker location |
| PUT | `/v1/twin/site/{id}/access` | Update site access counts |
| GET | `/v1/staff/schedule/{project_id}` | Get project schedule |

---

## Agent Definitions

### Project Manager Agent

**Agent ID**: `agent:project_manager`

**Purpose**: End-to-end project coordination including schedule management, resource allocation, and stakeholder communication.

**Capabilities**:
- Critical path analysis and schedule optimization
- Resource leveling and conflict resolution
- Change order management
- Stakeholder reporting automation
- Risk prediction and mitigation

**Core Functions**:

```json
{
  "agent_id": "agent:project_manager",
  "type": "PROJECT_MANAGER_AGENT",
  "version": "3.2.0",
  "capabilities": [
    "schedule_optimization",
    "resource_allocation",
    "critical_path_analysis",
    "change_order_management",
    "stakeholder_reporting",
    "risk_prediction"
  ],
  "configuration": {
    "schedule_lookahead_days": 30,
    "resource_conflict_threshold": 0.15,
    "risk_threshold_high": 0.7,
    "auto_escalation_enabled": true,
    "escalation_delay_minutes": 60
  },
  "managed_twins": [
    "project:prj_*",
    "site:site_*",
    "contractor:ctr_*"
  ],
  "integration_ports": {
    "project_twin": 4001,
    "site_twin": 4022,
    "copilot_api": 4001
  }
}
```

---

### Safety Agent

**Agent ID**: `agent:safety_agent`

**Purpose**: Real-time safety monitoring, hazard detection, and incident response coordination.

**Capabilities**:
- Real-time hazard detection from IoT sensors
- Worker biometric monitoring and fatigue detection
- PPE compliance verification
- Incident response orchestration
- Safety training scheduling
- OSHA compliance reporting

**Core Functions**:

```json
{
  "agent_id": "agent:safety_agent",
  "type": "SAFETY_AGENT",
  "version": "2.8.0",
  "capabilities": [
    "hazard_detection",
    "biometric_monitoring",
    "ppe_compliance",
    "incident_response",
    "osha_reporting",
    "safety_training"
  ],
  "configuration": {
    "biometric_check_interval_seconds": 60,
    "fatigue_threshold_score": 0.75,
    "ppe_violation_alert_threshold": 3,
    "incident_escalation_seconds": 30,
    "near_miss_review_hours": 24
  },
  "managed_twins": [
    "site:site_*",
    "worker:wrk_*"
  ],
  "integration_ports": {
    "site_twin": 4022,
    "worker_twin": 4045,
    "compliance_checker": 4022
  }
}
```

---

### Labor Agent

**Agent ID**: `agent:labor_agent`

**Purpose**: Workforce optimization through intelligent scheduling, skill matching, and productivity analysis.

**Capabilities**:
- Multi-project workforce scheduling
- Skill-to-task matching
- Overtime optimization
- Cross-training recommendations
- Productivity benchmarking
- Union compliance tracking

**Core Functions**:

```json
{
  "agent_id": "agent:labor_agent",
  "type": "LABOR_AGENT",
  "version": "2.5.0",
  "capabilities": [
    "workforce_scheduling",
    "skill_matching",
    "overtime_optimization",
    "productivity_analysis",
    "cross_training",
    "union_compliance"
  ],
  "configuration": {
    "schedule_horizon_days": 14,
    "overtime_threshold_hours": 40,
    "skill_match_threshold": 0.85,
    "productivity_baseline_update_days": 30
  },
  "managed_twins": [
    "worker:wrk_*",
    "site:site_*",
    "equipment:eqp_*"
  ],
  "integration_ports": {
    "worker_twin": 4045,
    "site_twin": 4022,
    "rez_staff_api": 4045
  }
}
```

---

### Cost Agent

**Agent ID**: `agent:cost_agent`

**Purpose**: Financial analysis, cost prediction, and budget optimization across construction projects.

**Capabilities**:
- Real-time cost tracking and variance analysis
- Predictive cost forecasting
- Change order impact analysis
- Cash flow optimization
- Vendor payment optimization
- ROI analysis for equipment decisions

**Core Functions**:

```json
{
  "agent_id": "agent:cost_agent",
  "type": "COST_AGENT",
  "version": "2.1.0",
  "capabilities": [
    "cost_tracking",
    "variance_analysis",
    "cost_forecasting",
    "change_order_impact",
    "cash_flow_optimization",
    "payment_optimization"
  ],
  "configuration": {
    "forecast_horizon_months": 6,
    "variance_alert_threshold_percent": 3,
    "contingency_recommendation_enabled": true,
    "payment_terms_optimization": true
  },
  "managed_twins": [
    "project:prj_*",
    "contractor:ctr_*"
  ],
  "integration_ports": {
    "project_twin": 4001,
    "rez_pos_api": 4001
  }
}
```

---

### CRM Agent

**Agent ID**: `agent:crm_agent`

**Purpose**: Client relationship management, engagement campaigns, and retention strategies for construction projects.

**Capabilities**:
- Client profile management and enrichment
- Project-based customer segmentation
- Campaign execution across communication channels
- Client satisfaction tracking
- Retention prediction and intervention
- Stakeholder engagement analytics

**Core Functions**:

```json
{
  "agent_id": "agent:crm_agent",
  "type": "CUSTOMER_INTELLIGENCE",
  "version": "1.0.0",
  "capabilities": [
    "client_profile_management",
    "engagement_campaigns",
    "satisfaction_tracking",
    "retention_prediction",
    "stakeholder_analytics"
  ],
  "configuration": {
    "retention_alert_threshold": 0.7,
    "engagement_frequency_days": 14,
    "nps_survey_interval_days": 90
  },
  "managed_twins": [
    "project:prj_*",
    "contractor:ctr_*"
  ],
  "integration_ports": {
    "project_twin": 4001,
    "customer_twin": "TBD",
    "rez_crm_api": "TBD"
  }
}
```

---

## Business Copilot Queries

### Query Category 1: Project Status

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "What's the current project status for Midtown Tower?" | STATUS | Full project dashboard with KPIs |
| "Show me all at-risk milestones" | FILTER | Milestone list with risk factors |
| "What percentage complete are we?" | CALCULATE | Weighted progress breakdown |
| "Compare our schedule to baseline" | COMPARE | Gantt chart overlay comparison |

### Query Category 2: Financial Analysis

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "What's our current spend vs budget?" | ANALYZE | Budget comparison with variance |
| "Predict final project cost" | PREDICT | ML forecast with confidence intervals |
| "Which cost categories are over budget?" | IDENTIFY | Drill-down by category |
| "What's the ROI on the tower crane?" | CALCULATE | Equipment ROI analysis |

### Query Category 3: Workforce Insights

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "How many workers on site today?" | AGGREGATE | Real-time headcount |
| "Show me worker productivity trends" | TREND | Productivity score trends |
| "Who has certifications expiring within 30 days?" | FILTER | Certification expiry list |
| "Optimize tomorrow's workforce schedule" | OPTIMIZE | Suggested schedule with rationale |

### Query Category 4: Safety & Compliance

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "Any active safety hazards?" | STATUS | Hazard list with mitigations |
| "What's our current safety score?" | ANALYZE | Safety metrics dashboard |
| "Run a full compliance check" | EXECUTE | Compliance report with findings |
| "Show me all near-miss reports this week" | REPORT | Near-miss summary and trends |

### Query Category 5: Equipment Management

| Query | Intent | Generated Response |
|-------|--------|-------------------|
| "Equipment utilization this week?" | ANALYZE | Utilization by equipment |
| "When is the crane's next maintenance?" | STATUS | Maintenance schedule |
| "Any equipment availability conflicts?" | IDENTIFY | Equipment conflict report |
| "Recommend equipment for next phase" | RECOMMEND | Equipment plan with justification |

---

## Economic Integration

### Revenue Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REVENUE FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────────────┘

PROJECT VALUE CHAIN                      COST OPTIMIZATION
─────────────────────                     ──────────────────

┌──────────────┐                         ┌──────────────┐
│   Contract   │                         │   Material   │
│   Value      │                         │   Savings    │
└──────┬───────┘                         └──────┬───────┘
       │                                        │
       ▼                                        ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Progress   │───▶│   Revenue    │◀───│   Labor      │
│   Billings   │    │   Recognized │    │   Efficiency │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Margin     │
                    │   Protection │
                    └──────────────┘
```

### Cost Categories and Attribution

| Category | Allocation Method | Agent Tracking | Reporting |
|----------|-------------------|----------------|-----------|
| Labor | Time-and-materials tracking | Labor Agent | Weekly |
| Materials | Consumption-based | Project Manager | Daily |
| Equipment | Hourly depreciation | Labor Agent | Weekly |
| Subcontractors | Milestone-based | Project Manager | Per milestone |
| Overhead | Percentage allocation | Cost Agent | Monthly |
| Contingency | Risk-weighted reserve | Project Manager | As-needed |

### Economic KPIs

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| Cost Performance Index | EV/PV | 1.0+ | Weekly |
| Schedule Performance Index | EV/PV | 1.0+ | Weekly |
| Labor Productivity | Units produced/hour | +18% | Daily |
| Material Waste | Waste/total used | <3% | Monthly |
| Change Order Rate | CO value/contract | <5% | Monthly |
| Profit Margin | (Revenue-Cost)/Revenue | >12% | Monthly |

### Payment Integration

```json
{
  "payment_config": {
    "currency": "USD",
    "payment_terms": {
      "progress_billing": "monthly",
      "subcontractor_payments": "net_30",
      "material_suppliers": "net_45"
    },
    "retention": {
      "standard_rate": 0.10,
      "release_schedule": "upon_completion",
      "max_retention": 0.05
    },
    "invoice_workflow": {
      "submission_deadline": "5th_of_month",
      "approval_required": ["project_manager", "finance"],
      "payment_processing_days": 14
    }
  }
}
```

---

## 6-Week Implementation Roadmap

### Week 1: Foundation (Days 1-7)

**Objective**: Core infrastructure and authentication

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Twin schema validation | Platform Team | Validated schemas | None |
| OAuth2 authentication | Security Team | Auth service | None |
| Project Twin CRUD API | Backend Team | `/v1/twin/project/*` | Auth service |
| Site Twin CRUD API | Backend Team | `/v1/twin/site/*` | Auth service |
| Dev environment setup | DevOps | Docker compose | None |

**Success Criteria**:
- All schemas validate against JSON Schema draft-07
- Auth service handles 5K requests/minute
- API endpoints respond <50ms p99

### Week 2: Twin Synchronization (Days 8-14)

**Objective**: Real-time synchronization between twins

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Sync protocol implementation | Backend Team | Sync endpoints | Week 1 APIs |
| Project Twin ↔ Site Twin sync | Backend Team | Bidirectional sync | Week 1 APIs |
| Worker Twin location tracking | IoT Team | GPS sync service | Site Twin API |
| Equipment telemetry ingestion | IoT Team | Telemetry pipeline | Equipment Twin API |
| Unit tests | QA Team | 85% coverage | All above |

**Success Criteria**:
- Sync latency <1s for 99th percentile
- Location updates every 30 seconds
- Equipment telemetry ingested <5s latency

### Week 3: Product Integration (Days 15-21)

**Objective**: Connect all 5 products to twin layer

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| REZ POS → Project Twin | Product Team | Billing sync | Project Twin API |
| REZ Staff → Worker Twin | Product Team | Attendance sync | Worker Twin API |
| REZ Inventory → Project Twin | Product Team | Consumption tracking | Project Twin API |
| REZ Business Copilot → All | Product Team | Query interface | Week 2 sync |
| Compliance Checker → Twins | Product Team | Compliance API | All Twin APIs |

**Success Criteria**:
- All 5 products integrated
- End-to-end flows tested
- Monitoring dashboards operational

### Week 4: Agent Deployment (Days 22-28)

**Objective**: Deploy all 4 agents

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Project Manager Agent | ML Team | Schedule optimization | Week 1-2 APIs |
| Safety Agent deployment | ML Team | Real-time monitoring | Week 2 sync |
| Labor Agent deployment | Backend Team | Workforce scheduling | Week 3 staff |
| Cost Agent deployment | ML Team | Financial analysis | Week 3 POS |

**Success Criteria**:
- All agents handling 2K requests/minute each
- Agent-to-agent communication <200ms
- Graceful degradation implemented

### Week 5: Business Intelligence (Days 29-35)

**Objective**: Business Copilot and reporting

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Natural language parser | NLP Team | Query understanding | Week 1-4 |
| Analytics pipeline | Data Team | Metrics computation | Twin data |
| Copilot response templates | Product Team | Answer generation | Query parser |
| Financial dashboard | BI Team | Budget tracking | Cost Agent |
| Compliance reports | Compliance Team | OSHA reports | Compliance Checker |

**Success Criteria**:
- Copilot handles 75% of query types
- Dashboard refreshes <5 minutes
- Reports auto-generated weekly

### Week 6: Optimization & Launch (Days 36-42)

**Objective**: Performance optimization and launch

| Task | Owner | Deliverable | Dependencies |
|------|-------|-------------|--------------|
| Load testing | DevOps | Scale-out configs | Week 1-4 |
| Performance tuning | Backend Team | <100ms p99 latency | Load testing |
| Security audit | Security Team | Penetration testing | All systems |
| Documentation | All Teams | Integration docs | All systems |
| Launch decision | Leadership | Launch checklist | All above |

**Success Criteria**:
- All SLAs met (99.9% uptime, <100ms latency)
- Zero critical security findings
- Team trained and ready

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| Twin | Canonical digital representation of a physical entity with synchronized state |
| Agent | Autonomous software system that manages and orchestrates twin interactions |
| SPI | Schedule Performance Index (EV/PV) - measures schedule efficiency |
| CPI | Cost Performance Index (EV/AC) - measures cost efficiency |
| EV | Earned Value - measure of work completed |
| Change Order | Formal request to modify project scope, schedule, or budget |

---

## Appendix: API Rate Limits

| Endpoint Pattern | Limit | Window | Burst |
|-----------------|-------|--------|-------|
| `/v1/twin/project/*` | 5,000 | per minute | 7,500 |
| `/v1/twin/site/*` | 3,000 | per minute | 4,500 |
| `/v1/twin/worker/*` | 5,000 | per minute | 7,500 |
| `/v1/twin/equipment/*` | 2,000 | per minute | 3,000 |
| `/v1/agent/*` | 2,000 | per minute | 3,000 |
| `/v1/copilot/query` | 1,000 | per minute | 1,500 |

---

*Document Version: 1.0 | Last Updated: June 12, 2026*
