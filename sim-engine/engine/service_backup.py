import numpy as np
from typing import List, Dict, Any
from .rk4 import RK4Solver, TrainPhysics, POSITION_TOLERANCE
import logging

# Configurar logging para debug visual
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimulationService:
    """Serviço principal para orquestrar a simulação física"""

    def run_simulation(self, params) -> Dict[str, Any]:
        """
        Executa simulação completa baseada nos parâmetros

        Args:
            params: Parâmetros da simulação (SimulationParamsDto)

        Returns:
            Resultado da simulação com tempo, posição, velocidade e cronograma
        """
        # Extrair parâmetros
        stations = [(s.name, s.km * 1000) for s in params.stations]  # Converter km para metros
        stations.sort(key=lambda x: x[1])  # Ordenar por posição

        # Calcular distância total
        total_distance = stations[-1][1] - stations[0][1]

        # Configurar física do trem
        physics = TrainPhysics(
            initial_accel=params.initial_accel,
            threshold_speed=params.threshold_speed,
            max_speed=params.max_speed
        )

        # Configurar solver RK4
        solver = RK4Solver(dt=params.dt)

        # Simular ida e volta
        logger.info(f"🚀 Iniciando simulação - Total stations: {len(stations)}, Layover: {params.terminal_layover}s")

        outbound_result = self._simulate_direction(
            solver, physics, stations, params.dwell_time, "outbound"
        )

        logger.info(f"✅ IDA completa - Pontos: {len(outbound_result['time'])}, Tempo final: {outbound_result['final_time']:.1f}s")
        logger.info(f"   Posição final ida: {outbound_result['position'][-1]:.0f}m, Velocidade: {outbound_result['velocity'][-1]:.1f}m/s")

        # Simular volta com coordenadas espelhadas reais
        # Espelhamento direto: 0km→0km, 5km→10km, 15km→0km
        return_stations = []
        max_distance = stations[-1][1]  # Distância da última estação
        for name, original_pos in reversed(stations):
            # Espelhamento direto: preserva distâncias reais
            mirror_distance = max_distance - original_pos
            return_stations.append((name, mirror_distance))

        logger.info(f"🔄 Estações da volta: {[(name, pos/1000) for name, pos in return_stations]}")

        return_result = self._simulate_direction(
            solver, physics, return_stations, params.dwell_time, "return",
            time_offset=outbound_result["final_time"] + params.terminal_layover,
            total_distance=total_distance
        )

        logger.info(f"✅ VOLTA completa - Pontos: {len(return_result['time'])}, Tempo final: {return_result['final_time']:.1f}s")
        logger.info(f"   Posição final volta: {return_result['position'][-1]:.0f}m, Velocidade: {return_result['velocity'][-1]:.1f}m/s")

        # Adicionar terminal layover como pontos estáticos
        layover_points = int(params.terminal_layover / params.dt)
        logger.info(f"🕰️ Terminal Layover - {params.terminal_layover}s = {layover_points} pontos")

        if layover_points > 0:
            layover_start_time = outbound_result["final_time"]
            layover_time = [layover_start_time + i * params.dt for i in range(layover_points)]
            layover_position = [outbound_result["position"][-1]] * layover_points
            layover_velocity = [0.0] * layover_points
            logger.info(f"   Layover de {layover_start_time:.1f}s a {layover_time[-1]:.1f}s na posição {layover_position[0]:.0f}m")
        else:
            layover_time, layover_position, layover_velocity = [], [], []
            logger.info("   Sem layover (duração = 0)")

        # Combinar resultados com terminal layover explícito
        logger.info(f"🔧 Combinando dados:")
        logger.info(f"   Ida: {len(outbound_result['time'])} pontos")
        logger.info(f"   Layover: {len(layover_time)} pontos")
        logger.info(f"   Volta: {len(return_result['time'])} pontos")

        # Ajustar posições da volta para manter continuidade
        # A volta começa na última posição da ida/layover
        last_outbound_position = layover_position[-1] if layover_position else outbound_result["position"][-1]

        # Corrigir coordenadas da volta: mapear do sistema espelhado para sistema absoluto
        # Na volta, o trem deve ir de last_outbound_position de volta para 0m
        adjusted_return_positions = []

        if len(return_result["position"]) > 0:
            # As posições da volta estão em coordenadas "espelhadas"
            # Precisamos mapear elas de volta para o sistema absoluto original
            return_start_pos = return_result["position"][0]  # Primeira posição da volta (no sistema espelhado)
            return_end_pos = return_result["position"][-1]   # Última posição da volta (no sistema espelhado)

            # Distância total percorrida na volta (no sistema espelhado)
            return_distance_traveled = return_end_pos - return_start_pos

            # Mapear cada posição da volta para o sistema absoluto
            for i, pos in enumerate(return_result["position"]):
                if i == 0:
                    # Primeiro ponto: manter continuidade com a ida
                    adjusted_return_positions.append(last_outbound_position)
                else:
                    # Progresso da volta baseado na distância percorrida
                    distance_from_start = pos - return_start_pos
                    if return_distance_traveled > 0:
                        progress = distance_from_start / return_distance_traveled
                    else:
                        progress = i / (len(return_result["position"]) - 1)

                    # Posição absoluta: vai linearmente de last_outbound_position até 0
                    absolute_position = last_outbound_position * (1 - progress)
                    adjusted_return_positions.append(absolute_position)

        logger.info(f"   🔧 Posições ajustadas da volta: {len(adjusted_return_positions)} pontos")
        logger.info(f"   📍 Última posição ida: {last_outbound_position:.1f}m")
        logger.info(f"   📍 Primeira posição volta: {adjusted_return_positions[0]:.1f}m")
        logger.info(f"   📍 Última posição volta: {adjusted_return_positions[-1]:.1f}m")

        combined_time = outbound_result["time"] + layover_time + return_result["time"]
        combined_position = outbound_result["position"] + layover_position + adjusted_return_positions
        combined_velocity = outbound_result["velocity"] + layover_velocity + return_result["velocity"]
        combined_schedule = outbound_result["schedule"] + return_result["schedule"]

        logger.info(f"✅ Dados combinados: {len(combined_time)} pontos totais")
        logger.info(f"   Tempo total: {max(combined_time):.1f}s ({max(combined_time)/60:.1f}min)")
        logger.info(f"   Posição máxima: {max(combined_position):.0f}m")
        logger.info(f"   Velocidade máxima: {max(combined_velocity):.1f}m/s")

        result = {
            "time": combined_time,
            "position": combined_position,
            "velocity": combined_velocity,
            "schedule": combined_schedule
        }

        # Validar continuidade dos dados
        self._validate_data_continuity(result)

        return result

    def _simulate_direction(self, solver: RK4Solver, physics: TrainPhysics,
                          stations: List[tuple], dwell_time: float,
                          direction: str, time_offset: float = 0,
                          total_distance: float = 0) -> Dict[str, Any]:
        """Simula movimento em uma direção"""

        all_time = []
        all_position = []
        all_velocity = []
        schedule = []

        current_time = time_offset
        current_position = stations[0][1]
        current_velocity = 0.0

        for i in range(len(stations) - 1):
            start_station = stations[i]
            end_station = stations[i + 1]

            segment_distance = end_station[1] - start_station[1]

            # Simular movimento até a próxima estação com extensão automática
            t, pos, vel = self._simulate_with_extension(
                solver, physics, current_position, current_velocity,
                end_station[1], current_time
            )

            # Encontrar quando chegamos na estação
            arrival_idx = self._find_arrival_index(pos, end_station[1])

            if arrival_idx < len(t):
                # Truncar arrays até o ponto de chegada
                t = t[:arrival_idx + 1]
                pos = pos[:arrival_idx + 1]
                vel = vel[:arrival_idx + 1]

                # Ajustar posição final exatamente na estação
                pos[-1] = end_station[1]
                vel[-1] = 0.0  # Parar na estação

            # Posição da estação para pontos de dwell
            station_position = end_station[1]  # Já em coordenadas corretas (espelhadas se volta)

            # Adicionar segmento de viagem aos resultados
            all_time.extend(t.tolist())
            all_position.extend(pos.tolist())
            all_velocity.extend(vel.tolist())

            # Registrar tempo de chegada
            arrival_time = t[-1]
            departure_time = arrival_time + dwell_time

            # PONTOS DE DWELL OBRIGATÓRIOS:
            # 1. Ponto de arrival (já existe no final do segmento)

            # 2. Ponto de departure (se houver dwell_time)
            if dwell_time > 0:
                all_time.append(departure_time)
                all_position.append(station_position)
                all_velocity.append(0.0)

                logger.info(f"   Dwell na {end_station[0]}: {arrival_time:.1f}s → {departure_time:.1f}s ({dwell_time:.1f}s)")

            schedule.append({
                "station": end_station[0],
                "arrival_time": arrival_time,
                "departure_time": departure_time
            })

            # Atualizar para próximo segmento
            current_time = departure_time
            current_position = end_station[1]  # Posição simulada (antes de conversão)
            current_velocity = 0.0

        return {
            "time": all_time,
            "position": all_position,
            "velocity": all_velocity,
            "schedule": schedule,
            "final_time": current_time
        }

    def _estimate_travel_time(self, distance: float, max_speed: float,
                            acceleration: float) -> float:
        """Estima tempo de viagem para um segmento"""
        if distance <= 0 or acceleration <= 0 or max_speed <= 0:
            return 100.0  # Tempo padrão seguro

        # Tempo para acelerar até velocidade máxima
        accel_time = max_speed / acceleration
        accel_distance = 0.5 * acceleration * accel_time ** 2

        if distance <= 2 * accel_distance:
            # Viagem curta - só acelera e desacelera
            sqrt_term = distance / acceleration
            if sqrt_term <= 0:
                return 100.0
            return 2 * np.sqrt(sqrt_term)
        else:
            # Viagem longa - acelera, velocidade constante, desacelera
            constant_distance = distance - 2 * accel_distance
            constant_time = constant_distance / max_speed
            return 2 * accel_time + constant_time

    def _validate_data_continuity(self, result: Dict[str, Any]) -> None:
        """Valida continuidade dos dados para detectar problemas visuais"""
        logger.info(f"🔍 Validando continuidade dos dados...")

        time_array = result['time']
        position_array = result['position']
        velocity_array = result['velocity']

        # Detectar saltos temporais
        large_time_gaps = []
        for i in range(1, len(time_array)):
            time_gap = time_array[i] - time_array[i-1]
            if time_gap > 1.0:  # Gap > 1 segundo
                large_time_gaps.append((i, time_gap))

        if large_time_gaps:
            logger.warning(f"⚠️  {len(large_time_gaps)} gaps temporais grandes detectados")
            for idx, gap in large_time_gaps[:3]:  # Mostrar apenas os primeiros 3
                logger.warning(f"   Índice {idx}: gap de {gap:.1f}s")

        # Detectar saltos de posição
        large_position_jumps = []
        for i in range(1, len(position_array)):
            time_diff = time_array[i] - time_array[i-1]
            pos_diff = abs(position_array[i] - position_array[i-1])
            if time_diff < 1.0 and pos_diff > 1000:  # Salto > 1km em < 1s
                large_position_jumps.append((i, pos_diff, time_diff))

        if large_position_jumps:
            logger.error(f"🔴 {len(large_position_jumps)} SALTOS DE POSIÇÃO detectados!")
            for idx, jump, time_diff in large_position_jumps:
                logger.error(f"   Índice {idx}: salto de {jump:.0f}m em {time_diff:.3f}s")
        else:
            logger.info("✅ Nenhum salto de posição detectado")

        # Verificar terminal layover visível
        zero_velocity_periods = []
        current_start = None
        for i, vel in enumerate(velocity_array):
            if vel == 0.0:
                if current_start is None:
                    current_start = i
            else:
                if current_start is not None:
                    duration = time_array[i-1] - time_array[current_start]
                    if duration > 10:  # Períodos > 10s
                        zero_velocity_periods.append(duration)
                    current_start = None

        long_stops = [p for p in zero_velocity_periods if p >= 200]  # >= 200s
        if long_stops:
            logger.info(f"✅ Terminal layover visível: {len(long_stops)} períodos longos")
            for duration in long_stops:
                logger.info(f"   Período de {duration:.1f}s")
        else:
            logger.warning("⚠️  Terminal layover pode não estar visível")

    def _simulate_with_extension(self, solver: RK4Solver, physics: TrainPhysics,
                               start_pos: float, start_vel: float, target_pos: float,
                               start_time: float, max_extensions: int = 3):
        """Simula com extensão automática até atingir target"""

        segment_distance = abs(target_pos - start_pos)
        estimated_time = self._estimate_travel_time(
            segment_distance, physics.max_speed, physics.initial_accel
        )
        current_span = estimated_time

        for attempt in range(max_extensions + 1):
            t, pos, vel = solver.solve(
                initial_position=start_pos,
                initial_velocity=start_vel,
                time_span=(start_time, start_time + current_span),
                acceleration_func=physics.acceleration_function,
                target_position=target_pos,
                use_braking=True
            )

            # Verificar se chegou próximo do alvo
            final_distance = abs(pos[-1] - target_pos)
            if final_distance < POSITION_TOLERANCE:
                logger.info(f"   Chegada bem-sucedida em {attempt+1} tentativa(s): distância final {final_distance:.2f}m")
                break

            # Estender tempo para próxima tentativa
            current_span *= 1.5
            logger.warning(f"   Estendendo tempo de simulação para {current_span:.1f}s (tentativa {attempt+1})")

        if final_distance >= POSITION_TOLERANCE:
            logger.error(f"   ⚠️  Falha ao alcançar target após {max_extensions+1} tentativas. Distância final: {final_distance:.2f}m")

        return t, pos, vel

    def _find_arrival_index(self, positions: np.ndarray, target_position: float) -> int:
        """Encontra o índice onde o trem chega na estação"""
        # Encontrar primeiro ponto onde posição >= posição da estação
        arrival_indices = np.where(positions >= target_position)[0]

        if len(arrival_indices) > 0:
            return arrival_indices[0]
        else:
            return len(positions) - 1