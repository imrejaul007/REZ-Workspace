"""
AssetMind Excel Engine - Real Excel Modeling Engine
Port: 5283
"""

import uuid
import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Excel Engine", description="Real Excel Modeling Engine with Live Formulas", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class CellType(str, Enum):
    NUMBER = "number"
    TEXT = "text"
    FORMULA = "formula"
    EMPTY = "empty"

class ScenarioType(str, Enum):
    BASE_CASE = "base_case"
    BULL_CASE = "bull_case"
    BEAR_CASE = "bear_case"

# Models
class Cell(BaseModel):
    sheet: str
    row: int
    col: int
    cell_ref: str
    value: Any = None
    formula: Optional[str] = None
    cell_type: CellType = CellType.EMPTY
    format: Optional[str] = None
    calculated_value: Any = None
    dependencies: List[str] = []
    depends_on: List[str] = []

class Sheet(BaseModel):
    name: str
    model_id: str
    row_count: int = 100
    col_count: int = 26
    cells: Dict[str, Cell] = {}

class Model(BaseModel):
    id: str = Field(default_factory=lambda: f"model_{uuid.uuid4().hex[:8]}")
    name: str
    description: Optional[str] = None
    sheets: List[Sheet] = []
    calculated: bool = False
    last_calculated: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ModelCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    sheets: List[str] = ["Sheet1"]

class CellSetRequest(BaseModel):
    sheet: str
    row: int
    col: int
    value: Any
    cell_type: CellType = CellType.NUMBER

class CellFormulaRequest(BaseModel):
    formula: str
    format: Optional[str] = None

class CalculationResult(BaseModel):
    model_id: str
    calculated: bool
    values: Dict[str, Any]
    errors: List[Dict[str, str]] = []

class ScenarioInput(BaseModel):
    cell_ref: str
    value: Any

class ScenarioRunRequest(BaseModel):
    scenario_type: ScenarioType = ScenarioType.BASE_CASE
    input_values: List[ScenarioInput]

class ScenarioComparison(BaseModel):
    scenarios: Dict[str, Dict[str, Any]]
    comparison: Dict[str, Dict[str, Any]]

# Storage
models_db: Dict[str, Model] = {}

# Helper Functions
def col_to_index(col: str) -> int:
    result = 0
    for char in col.upper():
        result = result * 26 + (ord(char) - ord('A') + 1)
    return result - 1

def index_to_col(index: int) -> str:
    result = ""
    index += 1
    while index > 0:
        index -= 1
        result = chr(ord('A') + index % 26) + result
        index //= 26
    return result

def parse_cell_ref(ref: str) -> tuple:
    parts = ref.split("!")
    sheet = parts[0] if len(parts) == 2 else "Sheet1"
    cell = parts[-1]
    match = re.match(r"([A-Za-z]+)(\d+)", cell)
    if match:
        return sheet, int(match.group(2)) - 1, col_to_index(match.group(1))
    raise ValueError(f"Invalid cell reference: {ref}")

def make_cell_ref(sheet: str, row: int, col: int) -> str:
    return f"{sheet}!{index_to_col(col)}{row + 1}" if sheet != "Sheet1" else f"{index_to_col(col)}{row + 1}"

def parse_range(range_str: str) -> List[str]:
    parts = range_str.split(":")
    if len(parts) != 2:
        return [range_str]
    start_sheet, start_row, start_col = parse_cell_ref(parts[0])
    end_sheet, end_row, end_col = parse_cell_ref(parts[1])
    cells = []
    for row in range(start_row, end_row + 1):
        for col in range(start_col, end_col + 1):
            cells.append(make_cell_ref(start_sheet, row, col))
    return cells

def extract_dependencies(formula: str) -> List[str]:
    matches = re.findall(r"[A-Za-z]+[0-9]+", formula)
    return list(set(matches))

def evaluate_formula(formula: str, cells: Dict[str, Any]) -> float:
    formula = formula.lstrip("=")
    if formula.upper().startswith("SUM"):
        match = re.search(r"SUM\(([^)]+)\)", formula, re.IGNORECASE)
        if match:
            refs = parse_range(match.group(1))
            return sum(cells.get(ref, 0) for ref in refs)
    if formula.upper().startswith("AVERAGE"):
        match = re.search(r"AVERAGE\(([^)]+)\)", formula, re.IGNORECASE)
        if match:
            refs = parse_range(match.group(1))
            values = [cells.get(ref, 0) for ref in refs if ref in cells]
            return sum(values) / len(values) if values else 0
    if formula.upper().startswith("MIN"):
        match = re.search(r"MIN\(([^)]+)\)", formula, re.IGNORECASE)
        if match:
            refs = parse_range(match.group(1))
            values = [cells.get(ref, 0) for ref in refs if ref in cells]
            return min(values) if values else 0
    if formula.upper().startswith("MAX"):
        match = re.search(r"MAX\(([^)]+)\)", formula, re.IGNORECASE)
        if match:
            refs = parse_range(match.group(1))
            values = [cells.get(ref, 0) for ref in refs if ref in cells]
            return max(values) if values else 0
    try:
        expr = formula
        for ref in re.findall(r"[A-Za-z]+[0-9]+", formula):
            expr = expr.replace(ref, str(cells.get(ref, 0)))
        return eval(expr)
    except:
        return 0.0

def get_model_cells(model: Model) -> Dict[str, Any]:
    values = {}
    for sheet in model.sheets:
        for cell in sheet.cells.values():
            if cell.calculated_value is not None:
                values[cell.cell_ref] = cell.calculated_value
            elif cell.value is not None:
                values[cell.cell_ref] = cell.value
    return values

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "assetmind-excel-engine", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat(), "stats": {"models": len(models_db)}}

@app.post("/models", response_model=Model, status_code=201)
async def create_model(model_data: ModelCreate):
    model = Model(name=model_data.name, description=model_data.description, sheets=[Sheet(name=name, model_id="") for name in model_data.sheets])
    for sheet in model.sheets:
        sheet.model_id = model.id
    models_db[model.id] = model
    return model

@app.get("/models", response_model=List[Model])
async def list_models(skip: int = 0, limit: int = 50):
    models = list(models_db.values())
    models.sort(key=lambda x: x.updated_at, reverse=True)
    return models[skip:skip + limit]

@app.get("/models/{model_id}", response_model=Model)
async def get_model(model_id: str):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    return models_db[model_id]

@app.delete("/models/{model_id}", status_code=204)
async def delete_model(model_id: str):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    del models_db[model_id]

@app.post("/models/{model_id}/sheets")
async def add_sheet(model_id: str, sheet_name: str):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    if any(s.name == sheet_name for s in model.sheets):
        raise HTTPException(status_code=400, detail="Sheet name already exists")
    new_sheet = Sheet(name=sheet_name, model_id=model_id)
    model.sheets.append(new_sheet)
    model.updated_at = datetime.utcnow()
    return {"sheet_name": sheet_name, "status": "added"}

@app.get("/models/{model_id}/sheets")
async def list_sheets(model_id: str):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    return [{"name": s.name, "row_count": s.row_count, "col_count": s.col_count} for s in models_db[model_id].sheets]

@app.post("/models/{model_id}/cells")
async def set_cell(model_id: str, cell_data: CellSetRequest):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    sheet = next((s for s in model.sheets if s.name == cell_data.sheet), None)
    if not sheet:
        raise HTTPException(status_code=404, detail=f"Sheet '{cell_data.sheet}' not found")
    cell_ref = make_cell_ref(cell_data.sheet, cell_data.row, cell_data.col)
    if cell_ref in sheet.cells:
        cell = sheet.cells[cell_ref]
        cell.value = cell_data.value
        cell.cell_type = cell_data.cell_type
    else:
        cell = Cell(sheet=cell_data.sheet, row=cell_data.row, col=cell_data.col, cell_ref=cell_ref, value=cell_data.value, cell_type=cell_data.cell_type)
        sheet.cells[cell_ref] = cell
    model.updated_at = datetime.utcnow()
    model.calculated = False
    return cell

@app.post("/models/{model_id}/cells/{sheet_name}/{cell_ref}/formula")
async def set_formula(model_id: str, sheet_name: str, cell_ref: str, formula_data: CellFormulaRequest):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    sheet = next((s for s in model.sheets if s.name == sheet_name), None)
    if not sheet:
        raise HTTPException(status_code=404, detail=f"Sheet '{sheet_name}' not found")
    _, row, col = parse_cell_ref(cell_ref)
    full_ref = cell_ref if "!" in cell_ref else f"{sheet_name}!{cell_ref}"
    dependencies = extract_dependencies(formula_data.formula)
    if full_ref in sheet.cells:
        cell = sheet.cells[full_ref]
        cell.formula = formula_data.formula
        cell.cell_type = CellType.FORMULA
        cell.format = formula_data.format
        cell.dependencies = dependencies
    else:
        cell = Cell(sheet=sheet_name, row=row, col=col, cell_ref=full_ref, formula=formula_data.formula, cell_type=CellType.FORMULA, format=formula_data.format, dependencies=dependencies)
        sheet.cells[full_ref] = cell
    model.updated_at = datetime.utcnow()
    model.calculated = False
    return cell

@app.get("/models/{model_id}/cells/{sheet_name}/{cell_ref}")
async def get_cell(model_id: str, sheet_name: str, cell_ref: str):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    sheet = next((s for s in model.sheets if s.name == sheet_name), None)
    if not sheet:
        raise HTTPException(status_code=404, detail=f"Sheet '{sheet_name}' not found")
    full_ref = cell_ref if "!" in cell_ref else f"{sheet_name}!{cell_ref}"
    if full_ref not in sheet.cells:
        raise HTTPException(status_code=404, detail="Cell not found")
    return sheet.cells[full_ref]

@app.post("/models/{model_id}/calculate", response_model=CalculationResult)
async def calculate_model(model_id: str):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    values = {}
    errors = []
    for sheet in model.sheets:
        for cell in sheet.cells.values():
            if cell.calculated_value is not None:
                values[cell.cell_ref] = cell.calculated_value
            elif cell.value is not None:
                values[cell.cell_ref] = cell.value
    for sheet in model.sheets:
        for cell in sheet.cells.values():
            if cell.cell_type == CellType.FORMULA and cell.formula:
                try:
                    result = evaluate_formula(cell.formula, values)
                    cell.calculated_value = result
                    values[cell.cell_ref] = result
                except Exception as e:
                    errors.append({"cell": cell.cell_ref, "error": str(e)})
    model.calculated = True
    model.last_calculated = datetime.utcnow()
    model.updated_at = datetime.utcnow()
    return CalculationResult(model_id=model_id, calculated=True, values={k: v for k, v in values.items()}, errors=errors)

@app.post("/models/{model_id}/scenarios/run", response_model=ScenarioComparison)
async def run_scenarios(model_id: str, request: ScenarioRunRequest):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    base_values = get_model_cells(model)
    scenarios = {}
    for scenario_type in [ScenarioType.BASE_CASE, ScenarioType.BULL_CASE, ScenarioType.BEAR_CASE]:
        scenario_values = base_values.copy()
        for input_val in request.input_values:
            if input_val.cell_ref in scenario_values:
                if scenario_type == ScenarioType.BULL_CASE:
                    scenario_values[input_val.cell_ref] *= 1.2
                elif scenario_type == ScenarioType.BEAR_CASE:
                    scenario_values[input_val.cell_ref] *= 0.8
        scenarios[scenario_type.value] = scenario_values
    results = {}
    for scenario_type_str, scenario_values in scenarios.items():
        for sheet in model.sheets:
            for cell in sheet.cells.values():
                if cell.cell_type == CellType.FORMULA and cell.formula:
                    try:
                        result = evaluate_formula(cell.formula, scenario_values)
                        results.setdefault(scenario_type_str, {})[cell.cell_ref] = result
                    except:
                        pass
    comparison = {}
    if results:
        base_cells = set(results.get("base_case", {}).keys())
        for cell_ref in base_cells:
            comparison[cell_ref] = {"base": results.get("base_case", {}).get(cell_ref), "bull": results.get("bull_case", {}).get(cell_ref), "bear": results.get("bear_case", {}).get(cell_ref)}
    return ScenarioComparison(scenarios=results, comparison=comparison)

@app.get("/models/{model_id}/dependencies")
async def get_dependencies(model_id: str, cell_ref: Optional[str] = None):
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    model = models_db[model_id]
    dependencies = []
    for sheet in model.sheets:
        for cell in sheet.cells.values():
            if cell_ref is None or cell.cell_ref == cell_ref:
                dependencies.append({"cell_ref": cell.cell_ref, "depends_on": cell.dependencies, "depended_by": cell.depends_on})
    return dependencies

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5283)