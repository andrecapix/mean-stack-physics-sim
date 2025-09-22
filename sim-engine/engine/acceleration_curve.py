"""
Acceleration Curve Module
Handles acceleration profiles that vary with velocity
"""

from typing import List, Dict, Tuple
import numpy as np


class AccelerationCurve:
    """Class to manage acceleration curves based on velocity"""

    def __init__(self, config: Dict[str, float]):
        """
        Initialize the acceleration curve with configuration parameters

        Args:
            config: Dictionary containing:
                - linear_velocity_threshold: Velocity threshold in km/h
                - initial_acceleration: Initial acceleration in m/s²
                - velocity_increment: Velocity increment for calculation in km/h
                - loss_factor: Loss factor (dimensionless)
                - max_velocity: Maximum velocity in km/h
        """
        self.linear_velocity_threshold = config.get('linear_velocity_threshold', 30)  # km/h
        self.initial_acceleration = config.get('initial_acceleration', 1.1)  # m/s²
        self.velocity_increment = config.get('velocity_increment', 1)  # km/h
        self.loss_factor = config.get('loss_factor', 46)  # dimensionless
        self.max_velocity = config.get('max_velocity', 160)  # km/h

        # Pre-calculate the curve points for interpolation
        self.curve_points = self._calculate_curve_points()

    def _calculate_curve_points(self) -> List[Tuple[float, float]]:
        """
        Calculate the acceleration curve points

        Returns:
            List of tuples (velocity_m/s, acceleration_m/s²)
        """
        points = []
        current_acceleration = self.initial_acceleration

        velocity = 0
        while velocity <= self.max_velocity:
            # Convert velocity to m/s for internal use
            velocity_ms = velocity / 3.6

            if velocity <= self.linear_velocity_threshold:
                current_acceleration = self.initial_acceleration
            else:
                # Apply loss factor formula: A1 = A0 - (A0/loss_factor)
                current_acceleration = current_acceleration - (current_acceleration / self.loss_factor)

            points.append((velocity_ms, current_acceleration))
            velocity += self.velocity_increment

        return points

    def get_acceleration(self, velocity_ms: float) -> float:
        """
        Get acceleration for a given velocity using linear interpolation

        Args:
            velocity_ms: Velocity in m/s

        Returns:
            Acceleration in m/s²
        """
        # Convert to km/h for comparison
        velocity_kmh = velocity_ms * 3.6

        # If velocity is beyond max, return the last acceleration value
        if velocity_kmh >= self.max_velocity:
            return self.curve_points[-1][1]

        # If velocity is negative or zero, return initial acceleration
        if velocity_ms <= 0:
            return self.initial_acceleration

        # Find the two points to interpolate between
        for i in range(len(self.curve_points) - 1):
            v1, a1 = self.curve_points[i]
            v2, a2 = self.curve_points[i + 1]

            if v1 <= velocity_ms <= v2:
                # Linear interpolation
                if v2 - v1 > 0:
                    fraction = (velocity_ms - v1) / (v2 - v1)
                    return a1 + fraction * (a2 - a1)
                else:
                    return a1

        # Default to last value if not found
        return self.curve_points[-1][1]

    def get_curve_data(self) -> Dict[str, List[float]]:
        """
        Get the curve data for visualization

        Returns:
            Dictionary with 'velocity' and 'acceleration' lists
        """
        velocities = []
        accelerations = []

        for v_ms, a in self.curve_points:
            velocities.append(v_ms * 3.6)  # Convert back to km/h for display
            accelerations.append(a)

        return {
            'velocity': velocities,
            'acceleration': accelerations
        }