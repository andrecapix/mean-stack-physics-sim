#!/usr/bin/env python3
"""
Test-Driven Debugging para problemas visuais nos gráficos
Seguindo boas práticas Claude Code
"""

import sys
import os
import json
import csv
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import SimulationParamsDto, StationDto
from engine.service import SimulationService

class VisualDataDebugger:
    """Debugger especializado para problemas de visualização"""

    def __init__(self):
        self.service = SimulationService()

    def test_reproduce_visual_problems(self):
        """Teste que reproduz exatamente os problemas visuais observados"""

        print("🔍 REPRODUZINDO PROBLEMAS VISUAIS...")

        # Parâmetros idênticos aos usados no frontend
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

        result = self.service.run_simulation(params)

        # Análise dos problemas observados
        problems = []

        # PROBLEMA 1: Linha vertical anômala na posição
        print("\n📊 ANÁLISE - PROBLEMA 1: Linha Vertical Anômala")
        time_array = result['time']
        position_array = result['position']

        # Detectar saltos verticais (mudanças > 1000m em < 1s)
        for i in range(1, len(position_array)):
            time_diff = time_array[i] - time_array[i-1]
            pos_diff = abs(position_array[i] - position_array[i-1])

            if time_diff < 1.0 and pos_diff > 1000:
                problems.append({
                    'type': 'vertical_jump',
                    'time_index': i,
                    'time': time_array[i],
                    'position_jump': pos_diff,
                    'time_diff': time_diff
                })
                print(f"⚠️  SALTO VERTICAL detectado no índice {i}")
                print(f"   Tempo: {time_array[i]:.1f}s, Salto: {pos_diff:.0f}m em {time_diff:.3f}s")

        # PROBLEMA 2: Velocidades instantâneas impossíveis
        print("\n📊 ANÁLISE - PROBLEMA 2: Velocidades Instantâneas")
        velocity_array = result['velocity']

        # Detectar mudanças instantâneas de velocidade (> 50 m/s em < 1s)
        for i in range(1, len(velocity_array)):
            time_diff = time_array[i] - time_array[i-1]
            vel_diff = abs(velocity_array[i] - velocity_array[i-1])

            if time_diff < 1.0 and vel_diff > 10:
                problems.append({
                    'type': 'instant_velocity',
                    'time_index': i,
                    'time': time_array[i],
                    'velocity_jump': vel_diff,
                    'time_diff': time_diff
                })
                print(f"⚠️  MUDANÇA INSTANTÂNEA de velocidade no índice {i}")
                print(f"   Tempo: {time_array[i]:.1f}s, Mudança: {vel_diff:.1f}m/s em {time_diff:.3f}s")

        # PROBLEMA 3: Terminal layover invisível
        print("\n📊 ANÁLISE - PROBLEMA 3: Terminal Layover Invisível")
        zero_velocity_periods = []
        current_period_start = None

        for i, vel in enumerate(velocity_array):
            if vel == 0.0:
                if current_period_start is None:
                    current_period_start = i
            else:
                if current_period_start is not None:
                    period_duration = time_array[i-1] - time_array[current_period_start]
                    zero_velocity_periods.append({
                        'start_time': time_array[current_period_start],
                        'end_time': time_array[i-1],
                        'duration': period_duration
                    })
                    current_period_start = None

        # Verificar se há período de 300s de velocidade zero (terminal layover)
        terminal_layover_found = any(period['duration'] >= 290 for period in zero_velocity_periods)

        if not terminal_layover_found:
            problems.append({
                'type': 'missing_terminal_layover',
                'expected_duration': 300.0,
                'found_periods': zero_velocity_periods
            })
            print(f"⚠️  TERMINAL LAYOVER não visível nos gráficos")
            print(f"   Períodos de velocidade 0 encontrados: {len(zero_velocity_periods)}")
            for period in zero_velocity_periods:
                print(f"   - {period['start_time']:.1f}s a {period['end_time']:.1f}s ({period['duration']:.1f}s)")

        # Exportar dados para análise detalhada
        self.export_debug_data(result, problems)

        return problems

    def export_debug_data(self, result, problems):
        """Exporta dados intermediários para análise visual"""

        print("\n💾 EXPORTANDO DADOS DE DEBUG...")

        # Criar dados em formato CSV para análise
        debug_data = []
        for i in range(len(result['time'])):
            debug_data.append({
                'index': i,
                'time': result['time'][i],
                'position': result['position'][i],
                'velocity': result['velocity'][i]
            })

        # Salvar CSV
        with open('debug_simulation_data.csv', 'w', newline='') as csvfile:
            fieldnames = ['index', 'time', 'position', 'velocity']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(debug_data)

        # Salvar JSON com problemas identificados
        with open('debug_problems.json', 'w') as jsonfile:
            json.dump({
                'total_points': len(result['time']),
                'total_time': max(result['time']),
                'max_position': max(result['position']),
                'max_velocity': max(result['velocity']),
                'problems': problems,
                'schedule': result['schedule']
            }, jsonfile, indent=2)

        print("✅ Arquivos exportados:")
        print("   - debug_simulation_data.csv (dados completos)")
        print("   - debug_problems.json (problemas identificados)")

    def test_isolate_outbound_only(self):
        """Isola apenas dados de ida para verificar se estão corretos"""

        print("\n🔬 TESTE ISOLADO - APENAS IDA...")

        # Modificar temporariamente o serviço para retornar apenas ida
        stations = [
            ("Station 1", 0),
            ("Station 2", 5000),
            ("Station 3", 10000),
            ("Station 4", 15000)
        ]

        from engine.rk4 import RK4Solver, TrainPhysics

        physics = TrainPhysics(
            initial_accel=3.0,
            threshold_speed=20.0,
            max_speed=30.0
        )

        solver = RK4Solver(dt=0.1)

        # Simular apenas ida
        outbound_result = self.service._simulate_direction(
            solver, physics, stations, 30.0, "outbound"
        )

        print(f"Pontos de ida: {len(outbound_result['time'])}")
        print(f"Tempo final ida: {outbound_result['final_time']:.1f}s")
        print(f"Posição máxima ida: {max(outbound_result['position']):.0f}m")

        # Exportar dados apenas da ida
        with open('debug_outbound_only.csv', 'w', newline='') as csvfile:
            fieldnames = ['time', 'position', 'velocity']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for i in range(len(outbound_result['time'])):
                writer.writerow({
                    'time': outbound_result['time'][i],
                    'position': outbound_result['position'][i],
                    'velocity': outbound_result['velocity'][i]
                })

        print("✅ Dados de ida exportados: debug_outbound_only.csv")
        return outbound_result

def main():
    """Executa todos os testes de debug visual"""

    print("🚀 INICIANDO TEST-DRIVEN DEBUGGING VISUAL")
    print("=" * 50)

    debugger = VisualDataDebugger()

    # Teste 1: Reproduzir problemas visuais
    problems = debugger.test_reproduce_visual_problems()

    # Teste 2: Isolar dados de ida
    outbound_data = debugger.test_isolate_outbound_only()

    # Resumo
    print("\n" + "=" * 50)
    print("📋 RESUMO DOS PROBLEMAS ENCONTRADOS:")
    print(f"Total de problemas identificados: {len(problems)}")

    for i, problem in enumerate(problems, 1):
        print(f"{i}. {problem['type']}")

    if not problems:
        print("✅ Nenhum problema detectado!")
    else:
        print("\n🔧 PRÓXIMOS PASSOS:")
        print("1. Analisar debug_simulation_data.csv")
        print("2. Comparar com debug_outbound_only.csv")
        print("3. Implementar correções baseadas nos problemas identificados")

if __name__ == "__main__":
    main()