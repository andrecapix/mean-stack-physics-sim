import numpy as np
from typing import Tuple, List

class RK4Solver:
    """Implementação do método Runge-Kutta de 4ª ordem para simulação física"""

    def __init__(self, dt: float = 0.1):
        self.dt = dt

    def solve(self,
              initial_position: float,
              initial_velocity: float,
              time_span: Tuple[float, float],
              acceleration_func,
              target_position: float = None,
              use_braking: bool = False) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Resolve o sistema usando RK4

        Args:
            initial_position: Posição inicial (m)
            initial_velocity: Velocidade inicial (m/s)
            time_span: (tempo_inicial, tempo_final)
            acceleration_func: Função que retorna aceleração dado (t, pos, vel)

        Returns:
            Tuple com arrays de (tempo, posição, velocidade)
        """
        t_start, t_end = time_span
        n_steps = int((t_end - t_start) / self.dt) + 1

        t = np.linspace(t_start, t_end, n_steps)
        position = np.zeros(n_steps)
        velocity = np.zeros(n_steps)

        # Condições iniciais
        position[0] = initial_position
        velocity[0] = initial_velocity

        for i in range(n_steps - 1):
            pos_curr = position[i]
            vel_curr = velocity[i]
            t_curr = t[i]

            # Determinar acelação baseada na proximidade do alvo
            if use_braking and target_position is not None:
                distance_to_target = abs(target_position - pos_curr)
                braking_distance = (vel_curr ** 2) / (2 * 2.0)  # Assumindo desaceleração de 2 m/s²

                if distance_to_target <= braking_distance and vel_curr > 0.5:
                    # Aplicar frenagem
                    current_accel = -2.0  # Desaceleração constante
                else:
                    # Aceleração normal
                    current_accel = acceleration_func(t_curr, pos_curr, vel_curr)
            else:
                current_accel = acceleration_func(t_curr, pos_curr, vel_curr)

            # RK4 para posição e velocidade
            k1_pos = vel_curr
            k1_vel = current_accel

            k2_pos = vel_curr + 0.5 * self.dt * k1_vel
            k2_vel = self._get_acceleration(t_curr + 0.5 * self.dt,
                                          pos_curr + 0.5 * self.dt * k1_pos,
                                          vel_curr + 0.5 * self.dt * k1_vel,
                                          acceleration_func, target_position, use_braking)

            k3_pos = vel_curr + 0.5 * self.dt * k2_vel
            k3_vel = self._get_acceleration(t_curr + 0.5 * self.dt,
                                          pos_curr + 0.5 * self.dt * k2_pos,
                                          vel_curr + 0.5 * self.dt * k2_vel,
                                          acceleration_func, target_position, use_braking)

            k4_pos = vel_curr + self.dt * k3_vel
            k4_vel = self._get_acceleration(t_curr + self.dt,
                                          pos_curr + self.dt * k3_pos,
                                          vel_curr + self.dt * k3_vel,
                                          acceleration_func, target_position, use_braking)

            # Atualização usando RK4
            position[i + 1] = pos_curr + (self.dt / 6) * (k1_pos + 2*k2_pos + 2*k3_pos + k4_pos)
            velocity[i + 1] = vel_curr + (self.dt / 6) * (k1_vel + 2*k2_vel + 2*k3_vel + k4_vel)

            # Garantir que velocidade esteja dentro dos limites físicos
            velocity[i + 1] = max(0, velocity[i + 1])

            # Parar se chegou muito perto do alvo
            if (target_position is not None and
                abs(position[i + 1] - target_position) < 0.1 and
                velocity[i + 1] < 0.5):
                velocity[i + 1] = 0.0
                position[i + 1] = target_position

        return t, position, velocity

    def _get_acceleration(self, t: float, pos: float, vel: float,
                         acceleration_func, target_position: float = None,
                         use_braking: bool = False) -> float:
        """Determina a aceleração considerando frenagem se necessário"""
        if use_braking and target_position is not None:
            distance_to_target = abs(target_position - pos)
            braking_distance = (vel ** 2) / (2 * 2.0)  # Desaceleração de 2 m/s²

            if distance_to_target <= braking_distance and vel > 0.5:
                return -2.0  # Desaceleração constante
            else:
                return acceleration_func(t, pos, vel)
        else:
            return acceleration_func(t, pos, vel)

class TrainPhysics:
    """Classe para definir a física específica do trem"""

    def __init__(self, initial_accel: float, threshold_speed: float, max_speed: float):
        self.initial_accel = initial_accel
        self.threshold_speed = threshold_speed
        self.max_speed = max_speed
        self.deceleration_rate = 2.0  # m/s² para frenagem

    def acceleration_function(self, t: float, position: float, velocity: float) -> float:
        """
        Define a função de aceleração baseada na velocidade atual

        Args:
            t: Tempo atual
            position: Posição atual
            velocity: Velocidade atual

        Returns:
            Aceleração em m/s²
        """
        if velocity < self.threshold_speed:
            return self.initial_accel
        elif velocity < self.max_speed:
            # Aceleração reduzida próximo à velocidade máxima
            return self.initial_accel * (1 - (velocity - self.threshold_speed) /
                                       (self.max_speed - self.threshold_speed))
        else:
            # Velocidade máxima atingida, sem aceleração
            return 0.0

    def braking_function(self, t: float, position: float, velocity: float) -> float:
        """Função de aceleração para frenagem"""
        return -self.deceleration_rate