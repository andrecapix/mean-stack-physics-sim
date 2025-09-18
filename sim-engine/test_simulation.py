#!/usr/bin/env python3
"""
Teste simples para validar correções na simulação física
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import SimulationParamsDto, StationDto
from engine.service import SimulationService
# import matplotlib.pyplot as plt  # Comentado para evitar erro no container

def test_basic_simulation():
    """Teste básico com parâmetros conhecidos"""

    # Criar parâmetros de teste
    params = SimulationParamsDto(
        initial_accel=3.0,
        threshold_speed=20.0,
        max_speed=30.0,
        stations=[
            StationDto(name="Station 1", km=0),
            StationDto(name="Station 2", km=5),
            StationDto(name="Station 3", km=10),
            StationDto(name="Station 4", km=15)
        ],
        dwell_time=30.0,
        terminal_layover=300.0,
        dt=0.1
    )

    # Executar simulação
    service = SimulationService()
    result = service.run_simulation(params)

    # Validações básicas
    print("=== VALIDAÇÃO DOS RESULTADOS ===")

    print(f"Total de pontos simulados: {len(result['time'])}")
    print(f"Tempo total: {max(result['time']):.1f}s ({max(result['time'])/60:.1f}min)")
    print(f"Posição máxima: {max(result['position']):.1f}m")
    print(f"Velocidade máxima: {max(result['velocity']):.1f}m/s")

    # Verificar schedule
    print(f"\n=== CRONOGRAMA ===")
    for entry in result['schedule']:
        arrival_min = int(entry['arrival_time'] // 60)
        arrival_sec = int(entry['arrival_time'] % 60)
        departure_min = int(entry['departure_time'] // 60)
        departure_sec = int(entry['departure_time'] % 60)
        print(f"{entry['station']}: Chegada {arrival_min}:{arrival_sec:02d}, Saída {departure_min}:{departure_sec:02d}")

    # Verificar terminal layover
    print(f"\n=== VERIFICAÇÃO TERMINAL LAYOVER ===")
    schedule = result['schedule']
    if len(schedule) >= 2:
        end_outbound = schedule[2]['departure_time']  # Station 4 saída
        start_return = schedule[3]['arrival_time']   # Station 3 chegada (volta)
        layover_actual = start_return - end_outbound
        print(f"Terminal layover configurado: {params.terminal_layover}s")
        print(f"Terminal layover real: {layover_actual:.1f}s")
        print(f"Diferença: {abs(layover_actual - params.terminal_layover):.1f}s")

    # Verificar limites de velocidade
    vel_violations = [v for v in result['velocity'] if v > params.max_speed + 0.1]
    print(f"\n=== VERIFICAÇÃO VELOCIDADE ===")
    print(f"Violações de velocidade máxima: {len(vel_violations)}")
    if vel_violations:
        print(f"Máxima violação: {max(vel_violations):.1f}m/s")

    return result

def plot_results(result):
    """Plot dos resultados para análise visual"""
    try:
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))

        # Gráfico de posição
        ax1.plot(result['time'], result['position'])
        ax1.set_ylabel('Posição (m)')
        ax1.set_title('Posição vs Tempo')
        ax1.grid(True)

        # Gráfico de velocidade
        ax2.plot(result['time'], result['velocity'])
        ax2.set_xlabel('Tempo (s)')
        ax2.set_ylabel('Velocidade (m/s)')
        ax2.set_title('Velocidade vs Tempo')
        ax2.grid(True)

        plt.tight_layout()
        plt.savefig('simulation_test_results.png', dpi=150, bbox_inches='tight')
        print("\n=== GRÁFICOS SALVOS ===")
        print("Arquivo: simulation_test_results.png")

    except ImportError:
        print("\n=== MATPLOTLIB NÃO DISPONÍVEL ===")
        print("Instale matplotlib para gerar gráficos: pip install matplotlib")

if __name__ == "__main__":
    print("Executando teste de simulação...")
    result = test_basic_simulation()
    plot_results(result)
    print("\nTeste concluído!")