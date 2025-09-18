import pytest
import numpy as np
from engine.rk4 import RK4Solver, TrainPhysics

class TestRK4Solver:

    def test_constant_acceleration(self):
        """Testa RK4 com aceleração constante"""
        solver = RK4Solver(dt=0.1)

        def constant_accel(t, pos, vel):
            return 2.0  # 2 m/s²

        t, pos, vel = solver.solve(
            initial_position=0.0,
            initial_velocity=0.0,
            time_span=(0, 5),
            acceleration_func=constant_accel
        )

        # Para aceleração constante: s = ut + 0.5*a*t²
        expected_pos_final = 0.5 * 2.0 * 5**2  # 25m
        expected_vel_final = 2.0 * 5  # 10 m/s

        assert abs(pos[-1] - expected_pos_final) < 0.1
        assert abs(vel[-1] - expected_vel_final) < 0.1

    def test_zero_acceleration(self):
        """Testa movimento uniforme (aceleração zero)"""
        solver = RK4Solver(dt=0.1)

        def zero_accel(t, pos, vel):
            return 0.0

        t, pos, vel = solver.solve(
            initial_position=0.0,
            initial_velocity=10.0,
            time_span=(0, 3),
            acceleration_func=zero_accel
        )

        # Movimento uniforme: s = ut
        expected_pos_final = 10.0 * 3  # 30m
        expected_vel_final = 10.0  # Velocidade constante

        assert abs(pos[-1] - expected_pos_final) < 0.1
        assert abs(vel[-1] - expected_vel_final) < 0.1

class TestTrainPhysics:

    def test_initial_acceleration_phase(self):
        """Testa fase de aceleração inicial"""
        physics = TrainPhysics(
            initial_accel=3.0,
            threshold_speed=20.0,
            max_speed=30.0
        )

        # Velocidade baixa - deve retornar aceleração inicial
        accel = physics.acceleration_function(0, 0, 5.0)
        assert accel == 3.0

        # Velocidade no limite - deve retornar aceleração inicial
        accel = physics.acceleration_function(0, 0, 19.9)
        assert accel == 3.0

    def test_transition_phase(self):
        """Testa fase de transição entre threshold e max speed"""
        physics = TrainPhysics(
            initial_accel=3.0,
            threshold_speed=20.0,
            max_speed=30.0
        )

        # Velocidade média na transição
        accel = physics.acceleration_function(0, 0, 25.0)
        assert 0 < accel < 3.0

        # Próximo à velocidade máxima
        accel = physics.acceleration_function(0, 0, 29.9)
        assert 0 <= accel < 0.5

    def test_max_speed_phase(self):
        """Testa comportamento na velocidade máxima"""
        physics = TrainPhysics(
            initial_accel=3.0,
            threshold_speed=20.0,
            max_speed=30.0
        )

        # Na velocidade máxima - sem aceleração
        accel = physics.acceleration_function(0, 0, 30.0)
        assert accel == 0.0

        # Acima da velocidade máxima - sem aceleração
        accel = physics.acceleration_function(0, 0, 35.0)
        assert accel == 0.0

    def test_braking_function(self):
        """Testa função de frenagem"""
        physics = TrainPhysics(
            initial_accel=3.0,
            threshold_speed=20.0,
            max_speed=30.0
        )

        # Frenagem deve ser negativa
        braking = physics.braking_function(0, 0, 25.0)
        assert braking == -2.0