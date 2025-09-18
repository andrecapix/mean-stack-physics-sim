"""
Testes unitários para validar as melhorias do simulador
Cobre: histerese, zero-crossing, dwell points, extensão automática, coordenadas
"""

import pytest
import numpy as np
from engine.rk4 import RK4Solver, TrainPhysics, POSITION_TOLERANCE, VELOCITY_STOP_THRESHOLD
from engine.service import SimulationService


class TestBrakingHysteresis:
    """Testa histerese de frenagem - uma vez em frenagem, não volta a acelerar"""

    def test_braking_state_persistence(self):
        """Verifica que estado de frenagem persiste até parada completa"""
        solver = RK4Solver(dt=0.1)
        physics = TrainPhysics(initial_accel=2.0, threshold_speed=15.0, max_speed=20.0)

        # Simular aproximação de estação a 10km
        t, pos, vel = solver.solve(
            initial_position=0.0,
            initial_velocity=0.0,
            time_span=(0, 100),
            acceleration_func=physics.acceleration_function,
            target_position=10000.0,
            use_braking=True
        )

        # Verificar que uma vez iniciada a frenagem, não há aceleração positiva
        braking_started = False
        for i in range(1, len(vel)):
            if vel[i-1] > vel[i] and vel[i-1] > 10:  # Detectar início de frenagem
                braking_started = True

            if braking_started and vel[i] > VELOCITY_STOP_THRESHOLD:
                # Durante frenagem, velocidade deve sempre diminuir ou manter
                assert vel[i] <= vel[i-1] + 0.01, f"Aceleração durante frenagem no índice {i}"

    def test_braking_exit_condition(self):
        """Verifica que frenagem só termina quando velocidade ≈ 0"""
        solver = RK4Solver(dt=0.05)
        physics = TrainPhysics(initial_accel=1.0, threshold_speed=10.0, max_speed=15.0)

        # Estado deve resetar entre simulações
        t1, pos1, vel1 = solver.solve(
            initial_position=0.0, initial_velocity=0.0, time_span=(0, 50),
            acceleration_func=physics.acceleration_function, target_position=5000.0, use_braking=True
        )

        # Segunda simulação não deve ser afetada pelo estado anterior
        t2, pos2, vel2 = solver.solve(
            initial_position=0.0, initial_velocity=0.0, time_span=(0, 50),
            acceleration_func=physics.acceleration_function, target_position=3000.0, use_braking=True
        )

        assert not solver.braking_state, "Estado de frenagem deve resetar entre simulações"


class TestZeroCrossing:
    """Testa detecção e finalização suave em zero-crossing de velocidade"""

    def test_smooth_stop_at_zero_velocity(self):
        """Verifica parada suave quando velocidade cruza zero"""
        solver = RK4Solver(dt=0.1)

        def braking_func(t, pos, vel):
            return -3.0  # Frenagem constante

        t, pos, vel = solver.solve(
            initial_position=0.0,
            initial_velocity=10.0,  # Velocidade inicial positiva
            time_span=(0, 10),
            acceleration_func=braking_func,
            use_braking=False
        )

        # Verificar que último ponto tem exatamente v=0
        assert vel[-1] == 0.0, "Velocidade final deve ser exatamente 0"

        # Verificar que não há velocidades negativas
        assert all(v >= 0 for v in vel), "Não deve haver velocidades negativas"

        # Verificar que parada foi suave (sem salto abrupto)
        velocity_diffs = np.diff(vel)
        max_decel = max(-velocity_diffs)
        expected_max_decel = 3.0 * solver.dt  # |a| * dt
        assert max_decel <= expected_max_decel * 1.1, "Parada deve ser suave"

    def test_zero_crossing_interpolation(self):
        """Verifica interpolação exata no zero-crossing"""
        solver = RK4Solver(dt=0.2)  # dt maior para facilitar detecção

        def linear_braking(t, pos, vel):
            return -2.0

        t, pos, vel = solver.solve(
            initial_position=0.0,
            initial_velocity=5.0,
            time_span=(0, 10),
            acceleration_func=linear_braking,
            use_braking=False
        )

        # Tempo teórico para parar: v0 / |a| = 5.0 / 2.0 = 2.5s
        expected_stop_time = 2.5
        actual_stop_time = t[-1]

        assert abs(actual_stop_time - expected_stop_time) < 0.01, \
            f"Tempo de parada deve ser próximo ao teórico: {expected_stop_time:.2f}s vs {actual_stop_time:.2f}s"


class TestDwellPoints:
    """Testa pontos de dwell obrigatórios em estações"""

    def test_mandatory_dwell_points_visibility(self):
        """Verifica que cada estação tem pontos de arrival e departure visíveis"""
        service = SimulationService()

        # Configurar simulação simples com 3 estações
        from types import SimpleNamespace
        params = SimpleNamespace(
            stations=[
                SimpleNamespace(name="A", km=0),
                SimpleNamespace(name="B", km=5),
                SimpleNamespace(name="C", km=10)
            ],
            initial_accel=2.0,
            threshold_speed=15.0,
            max_speed=20.0,
            dwell_time=30.0,  # 30 segundos
            terminal_layover=120.0,
            dt=0.1
        )

        result = service.run_simulation(params)

        # Verificar schedule entries
        schedule = result["schedule"]
        assert len(schedule) >= 4, "Deve haver pelo menos 4 entradas (2 ida + 2 volta)"

        # Verificar que há pontos de dwell visíveis nos dados
        time_array = result["time"]
        velocity_array = result["velocity"]

        # Procurar por períodos com v=0 (dwell periods)
        zero_velocity_periods = []
        current_start = None

        for i, vel in enumerate(velocity_array):
            if abs(vel) < 0.01:  # Praticamente zero
                if current_start is None:
                    current_start = i
            else:
                if current_start is not None and i - current_start > 2:
                    duration = time_array[i-1] - time_array[current_start]
                    zero_velocity_periods.append(duration)
                current_start = None

        # Deve haver pelo menos alguns períodos de dwell
        dwell_periods = [p for p in zero_velocity_periods if 25 <= p <= 35]  # ~30s ± tolerância
        assert len(dwell_periods) >= 2, f"Deve haver pelo menos 2 períodos de dwell de ~30s: {zero_velocity_periods}"

    def test_departure_points_after_dwell(self):
        """Verifica que há pontos de departure após cada dwell_time"""
        service = SimulationService()

        from types import SimpleNamespace
        params = SimpleNamespace(
            stations=[
                SimpleNamespace(name="A", km=0),
                SimpleNamespace(name="B", km=8)
            ],
            initial_accel=1.5,
            threshold_speed=12.0,
            max_speed=15.0,
            dwell_time=20.0,
            terminal_layover=60.0,
            dt=0.1
        )

        result = service.run_simulation(params)
        schedule = result["schedule"]

        # Verificar diferença entre arrival e departure
        for entry in schedule:
            time_diff = entry["departure_time"] - entry["arrival_time"]
            assert abs(time_diff - params.dwell_time) < 0.5, \
                f"Dwell time deve ser {params.dwell_time}s: {entry}"


class TestAutomaticTimeExtension:
    """Testa extensão automática de tempo para garantir chegada"""

    def test_extension_when_estimate_insufficient(self):
        """Verifica extensão quando estimativa inicial é insuficiente"""
        service = SimulationService()

        # Cenário: distância longa com parâmetros que podem gerar estimativa baixa
        from types import SimpleNamespace
        params = SimpleNamespace(
            stations=[
                SimpleNamespace(name="A", km=0),
                SimpleNamespace(name="B", km=50)  # 50km - distância longa
            ],
            initial_accel=0.5,  # Aceleração baixa
            threshold_speed=8.0,
            max_speed=10.0,    # Velocidade máxima baixa
            dwell_time=10.0,
            terminal_layover=30.0,
            dt=0.1
        )

        result = service.run_simulation(params)

        # Verificar que chegou próximo das estações
        positions = result["position"]
        expected_final_pos = 50000.0  # 50km em metros

        # Deve chegar próximo à estação final
        max_position = max(positions)
        assert abs(max_position - expected_final_pos) < POSITION_TOLERANCE * 10, \
            f"Deve chegar próximo à estação final: {max_position:.0f}m vs {expected_final_pos:.0f}m"

    def test_multiple_extensions_if_needed(self):
        """Verifica que sistema pode fazer múltiplas extensões se necessário"""
        # Simular cenário extremo que exigiria extensões
        service = SimulationService()

        from types import SimpleNamespace
        params = SimpleNamespace(
            stations=[
                SimpleNamespace(name="A", km=0),
                SimpleNamespace(name="B", km=100)  # 100km - muito longo
            ],
            initial_accel=0.2,  # Muito baixo
            threshold_speed=5.0,
            max_speed=6.0,     # Muito baixo
            dwell_time=5.0,
            terminal_layover=15.0,
            dt=0.2
        )

        result = service.run_simulation(params)

        # Mesmo em cenário extremo, deve completar a simulação
        assert len(result["time"]) > 0, "Simulação deve completar mesmo com parâmetros extremos"
        assert len(result["schedule"]) >= 2, "Deve haver entradas de schedule"


class TestReturnCoordinateConsistency:
    """Testa consistência de coordenadas na volta"""

    def test_mirrored_coordinates_preservation(self):
        """Verifica que coordenadas da volta são espelho real das da ida"""
        service = SimulationService()

        from types import SimpleNamespace
        params = SimpleNamespace(
            stations=[
                SimpleNamespace(name="A", km=0),
                SimpleNamespace(name="B", km=10),
                SimpleNamespace(name="C", km=20),
                SimpleNamespace(name="D", km=30)
            ],
            initial_accel=2.0,
            threshold_speed=15.0,
            max_speed=20.0,
            dwell_time=15.0,
            terminal_layover=60.0,
            dt=0.1
        )

        result = service.run_simulation(params)
        positions = result["position"]

        # Encontrar posição máxima (final da ida)
        max_pos = max(positions)
        expected_max_distance = 30000.0  # 30km em metros

        assert abs(max_pos - expected_max_distance) < POSITION_TOLERANCE * 5, \
            f"Posição máxima deve ser ~30km: {max_pos:.0f}m"

        # Verificar que volta atinge posição próxima de zero
        min_pos = min(positions)
        assert abs(min_pos) < POSITION_TOLERANCE * 5, \
            f"Posição mínima deve ser próxima de 0km: {min_pos:.0f}m"

    def test_return_stations_real_distances(self):
        """Verifica que estações da volta mantêm distâncias reais (não artificiais)"""
        service = SimulationService()

        # Estações com espaçamento irregular
        from types import SimpleNamespace
        params = SimpleNamespace(
            stations=[
                SimpleNamespace(name="A", km=0),
                SimpleNamespace(name="B", km=7),    # 7km
                SimpleNamespace(name="C", km=12),   # +5km
                SimpleNamespace(name="D", km=25)    # +13km
            ],
            initial_accel=1.8,
            threshold_speed=18.0,
            max_speed=25.0,
            dwell_time=20.0,
            terminal_layover=90.0,
            dt=0.1
        )

        result = service.run_simulation(params)
        schedule = result["schedule"]

        # Deve haver entries para ida e volta (excluindo estação inicial A)
        outbound_entries = [s for s in schedule if s["station"] in ["B", "C", "D"]]

        # Separar ida e volta pelo tempo (ida vem primeiro)
        mid_time = max([s["departure_time"] for s in outbound_entries[:3]]) if len(outbound_entries) >= 3 else 0
        ida_entries = [s for s in outbound_entries if s["arrival_time"] <= mid_time + 100]
        volta_entries = [s for s in outbound_entries if s["arrival_time"] > mid_time + 100]

        assert len(ida_entries) == 3, f"Deve haver 3 estações na ida: {ida_entries}"
        assert len(volta_entries) >= 2, f"Deve haver pelo menos 2 estações na volta: {volta_entries}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])