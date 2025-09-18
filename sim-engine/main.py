from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import uvicorn

from engine.service import SimulationService

app = FastAPI(
    title="Physics Simulation Engine",
    description="Microserviço para simulação física usando Runge-Kutta",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StationDto(BaseModel):
    name: str = Field(..., description="Nome da estação")
    km: float = Field(..., ge=0, description="Quilometragem da estação")

class SimulationParamsDto(BaseModel):
    initial_accel: float = Field(..., gt=0, description="Aceleração inicial (m/s²)")
    threshold_speed: float = Field(..., gt=0, description="Velocidade limite para mudança (m/s)")
    max_speed: float = Field(..., gt=0, description="Velocidade máxima (m/s)")
    stations: List[StationDto] = Field(..., min_items=2, description="Lista de estações")
    dwell_time: float = Field(..., ge=0, description="Tempo de parada nas estações (s)")
    terminal_layover: float = Field(..., ge=0, description="Tempo de espera no terminal (s)")
    dt: float = Field(0.1, gt=0, le=1, description="Passo de integração (s)")

class ScheduleEntry(BaseModel):
    station: str
    arrival_time: float
    departure_time: float

class SimulationResultDto(BaseModel):
    time: List[float]
    position: List[float]
    velocity: List[float]
    schedule: List[ScheduleEntry]

simulation_service = SimulationService()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sim-engine"}

@app.post("/simulate", response_model=SimulationResultDto)
async def simulate_physics(params: SimulationParamsDto):
    try:
        result = simulation_service.run_simulation(params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)