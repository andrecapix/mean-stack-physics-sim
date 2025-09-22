from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict
import uvicorn

from engine.service import SimulationService
from engine.acceleration_curve import AccelerationCurve

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

class AccelerationCurveConfig(BaseModel):
    linear_velocity_threshold: float = Field(30, gt=0, le=100, description="Velocidade linear em km/h")
    initial_acceleration: float = Field(1.1, gt=0, le=3, description="Aceleração inicial em m/s²")
    velocity_increment: float = Field(1, gt=0, le=10, description="Incremento de velocidade em km/h")
    loss_factor: float = Field(46, gt=0, le=1000, description="Fator de perda")
    max_velocity: float = Field(160, gt=0, le=300, description="Velocidade máxima em km/h")

class AccelerationCurvePoint(BaseModel):
    velocity: float = Field(..., description="Velocidade em km/h")
    acceleration: float = Field(..., description="Aceleração em m/s²")

class AccelerationCurveResponse(BaseModel):
    points: List[AccelerationCurvePoint]
    config: AccelerationCurveConfig

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

@app.post("/acceleration-curve/calculate", response_model=AccelerationCurveResponse)
async def calculate_acceleration_curve(config: AccelerationCurveConfig):
    """
    Calculate acceleration curve based on configuration.
    This endpoint is independent of the simulation and just returns the curve points.
    """
    try:
        # Create acceleration curve instance
        curve = AccelerationCurve(config.dict())

        # Get the curve data
        curve_data = curve.get_curve_data()

        # Format response
        points = []
        for v, a in zip(curve_data['velocity'], curve_data['acceleration']):
            points.append(AccelerationCurvePoint(velocity=v, acceleration=a))

        return AccelerationCurveResponse(
            points=points,
            config=config
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Curve calculation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)