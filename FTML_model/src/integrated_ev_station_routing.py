import torch
import numpy as np
import sys
sys.path.append("src")
from model import MLP
from sklearn.metrics.pairwise import haversine_distances

# Load Station Utility Model (MLP with 14 features)
station_model = MLP(input_size=14)
station_model.load_state_dict(torch.load("federated_mlp.pth"))
station_model.eval()

# Load Route Cost Model (MLP with 5 features)
route_model = MLP(input_size=5)
route_model.load_state_dict(torch.load("federated_route_model.pth"))
route_model.eval()

# Load Data from data/raw/
X_stations = np.load("data/raw/station_features.npy")  # shape: (N, 14)
coords = np.load("data/raw/station_coords.npy")        # shape: (N, 2)
num_stations = coords.shape[0]

# Define a source location (e.g., Mumbai)
source = [19.0760, 72.8777]
source_rad = np.radians([source])
coords_rad = np.radians(coords)

# Calculate Haversine distance (km)
distances_km = haversine_distances(source_rad, coords_rad)[0] * 6371  # Earth radius in km

# Simulate route features
travel_times = distances_km / 40 * 60       # Assume 40 km/h average speed → minutes
energy_used = distances_km * 0.2            # Assume 0.2 kWh/km
charging_wait = np.random.uniform(5, 30, size=num_stations)  # in minutes
congestion = np.random.uniform(0, 1, size=num_stations)      # normalized 0–1

route_features = np.stack([
    distances_km,
    travel_times,
    energy_used,
    charging_wait,
    congestion
], axis=1)

# Predict station utility
with torch.no_grad():
    station_input_tensor = torch.tensor(X_stations, dtype=torch.float32)
    station_scores = station_model(station_input_tensor).squeeze().numpy()

# Predict route cost
with torch.no_grad():
    route_input_tensor = torch.tensor(route_features, dtype=torch.float32)
    route_costs = route_model(route_input_tensor).squeeze().numpy()

# Combine Scores (Higher = Better)
final_score = station_scores - route_costs

# Get top N recommendations
top_n = 10
top_indices = np.argsort(final_score)[-top_n:][::-1]

print(f"\n🔝 Top {top_n} Recommended EV Stations from Source ({source[0]}, {source[1]}):\n")
for i, idx in enumerate(top_indices, 1):
    print(f"{i}. Station {idx}:")
    print(f"    Final Score   : {final_score[idx]:.2f}")
    print(f"    Utility Score : {station_scores[idx]:.2f}")
    print(f"    Route Cost    : {route_costs[idx]:.2f}")
    print(f"    Distance (km) : {distances_km[idx]:.2f}")
    print(f"    Coordinates   : (Lat: {coords[idx][0]:.4f}, Lon: {coords[idx][1]:.4f})\n")
