import numpy as np
from typing import Tuple, List, Optional, Dict

# Tolerâncias configuráveis para regimes físicos
VELOCITY_EPSILON_RATIO = 1e-3  # * max_speed (ex: 0.03 m/s para vmax=30m/s)
ACCELERATION_EPSILON_RATIO = 1e-3  # * max_accel (ex: 0.003 m/s² para amax=3m/s²)
POSITION_TOLERANCE = 1.0  # metros (para chegada em estações)
VELOCITY_STOP_THRESHOLD = 0.1  # m/s (limite para considerar parado)

class RK4Solver:
    """Implementação do método Runge-Kutta de 4ª ordem para simulação física"""

    def __init__(self, dt: float = 0.1):
        self.dt = dt
        self.braking_state = False  # Estado de frenagem com histerese

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

        # Reset braking state no início da simulação
        self.braking_state = False

        for i in range(n_steps - 1):
            pos_curr = position[i]
            vel_curr = velocity[i]
            t_curr = t[i]

            # Determinar aceleração com histerese de frenagem
            current_accel = self._get_acceleration_with_hysteresis(
                t_curr, pos_curr, vel_curr, acceleration_func,
                target_position, use_braking
            )

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
            new_position = pos_curr + (self.dt / 6) * (k1_pos + 2*k2_pos + 2*k3_pos + k4_pos)
            new_velocity = vel_curr + (self.dt / 6) * (k1_vel + 2*k2_vel + 2*k3_vel + k4_vel)

            # Detectar zero-crossing de velocidade
            if vel_curr > 0 and new_velocity < 0:
                # Interpolar para encontrar t* onde v=0
                zero_time_fraction = vel_curr / (vel_curr - new_velocity)

                # Recalcular posição no ponto exato v=0
                partial_dt = self.dt * zero_time_fraction
                position[i + 1] = pos_curr + vel_curr * partial_dt + 0.5 * current_accel * partial_dt**2
                velocity[i + 1] = 0.0

                # Ajustar array de tempo para refletir parada exata
                t[i + 1] = t[i] + partial_dt

                # Truncar arrays no ponto de parada
                t = t[:i + 2]
                position = position[:i + 2]
                velocity = velocity[:i + 2]
                break
            else:
                position[i + 1] = new_position
                velocity[i + 1] = max(0, new_velocity)  # Clamp como backup

            # Parar se chegou muito perto do alvo
            if (target_position is not None and
                abs(position[i + 1] - target_position) < 0.1 and
                velocity[i + 1] < 0.5):
                velocity[i + 1] = 0.0
                position[i + 1] = target_position
                break

        return t, position, velocity

    def _get_acceleration_with_hysteresis(self, t: float, pos: float, vel: float,
                                         acceleration_func, target_position: float = None,
                                         use_braking: bool = False) -> float:
        """Determina a aceleração considerando frenagem com histerese"""
        if not use_braking or target_position is None:
            return acceleration_func(t, pos, vel)

        distance_to_target = abs(target_position - pos)
        braking_distance = (vel ** 2) / (2 * 2.0)  # Desaceleração de 2 m/s²

        # Entrar em frenagem
        if not self.braking_state and distance_to_target <= braking_distance and vel > 0.5:
            self.braking_state = True

        # Sair de frenagem apenas quando quase parado
        if self.braking_state and vel <= VELOCITY_STOP_THRESHOLD:
            self.braking_state = False

        return -2.0 if self.braking_state else acceleration_func(t, pos, vel)

    def _get_acceleration(self, t: float, pos: float, vel: float,
                         acceleration_func, target_position: float = None,
                         use_braking: bool = False) -> float:
        """Método legado - mantido para compatibilidade"""
        return self._get_acceleration_with_hysteresis(t, pos, vel, acceleration_func, target_position, use_braking)

class TrainPhysics:
    """Classe para definir a física específica do trem"""

    def __init__(self, initial_accel: float, threshold_speed: float, max_speed: float,
                 acceleration_curve_config: Optional[Dict] = None):
        self.initial_accel = initial_accel
        self.threshold_speed = threshold_speed
        self.max_speed = max_speed
        self.deceleration_rate = 2.0  # m/s² para frenagem

        # Configurar curva de aceleração se fornecida
        self.acceleration_curve = None
        if acceleration_curve_config:
            from .acceleration_curve import AccelerationCurve
            self.acceleration_curve = AccelerationCurve(acceleration_curve_config)

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
            # Se há curva de aceleração configurada, usa interpolação da curva
            # APENAS para aceleração (valores positivos) - desaceleração continua igual
            if self.acceleration_curve:
                return self.acceleration_curve.get_acceleration(velocity)
            else:
                # Comportamento original: decremento linear
                return self.initial_accel * (1 - (velocity - self.threshold_speed) /
                                           (self.max_speed - self.threshold_speed))
        else:
            # Velocidade máxima atingida, sem aceleração
            return 0.0

    def braking_function(self, t: float, position: float, velocity: float) -> float:
        """Função de aceleração para frenagem"""
        return -self.deceleration_rate