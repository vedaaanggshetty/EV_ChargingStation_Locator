import numpy as np
import os

# Ensure output directory exists
output_dir = "data/processed"
os.makedirs(output_dir, exist_ok=True)

np.random.seed(42)
n_samples = 1000

# Features: [num_waypoints, total_distance_km, avg_speed_kmph, total_traffic_delay_min, energy_budget_kWh]
num_waypoints = np.random.randint(2, 12, n_samples).reshape(-1, 1)
total_distance_km = np.random.uniform(10, 500, n_samples).reshape(-1, 1)
avg_speed_kmph = np.random.uniform(30, 100, n_samples).reshape(-1, 1)
total_traffic_delay_min = np.random.uniform(0, 45, n_samples).reshape(-1, 1)
energy_budget_kWh = np.random.uniform(20, 100, n_samples).reshape(-1, 1)

# Target: Estimated travel time in minutes
total_travel_time_min = (total_distance_km / avg_speed_kmph * 60) + total_traffic_delay_min

X = np.hstack([
    num_waypoints,
    total_distance_km,
    avg_speed_kmph,
    total_traffic_delay_min,
    energy_budget_kWh
])
y = total_travel_time_min

np.save(os.path.join(output_dir, "X_route.npy"), X)
np.save(os.path.join(output_dir, "y_route.npy"), y)
print(f"✅ Saved route dataset. X shape: {X.shape}, y shape: {y.shape}")
