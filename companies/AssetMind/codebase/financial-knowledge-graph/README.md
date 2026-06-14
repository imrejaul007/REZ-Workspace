# Financial Knowledge Graph

Neo4j-based knowledge graph for financial entities.

## Features

- Company relationships
- Supply chain mapping
- Industry taxonomy
- Causal chains

## Quick Start

```bash
pip install -r requirements.txt
python src/__init__.py
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check |
| `/api/entities` | List entities |
| `/api/relationships` | List relationships |
| `/api/path` | Find paths |

## Graph Schema

- Nodes: Company, Person, Product, Market
- Edges: ACQUIRES, PARTNERS_WITH, COMPETES_WITH, SUPPLIES