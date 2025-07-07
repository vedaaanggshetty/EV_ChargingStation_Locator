import requests
import json
import numpy as np
import torch
import os
from model import MLP  # Input size: 14 for station, 5 for route

# 🔑 TomTom API setup
API_KEY = "ZlqKBSOjQlEAKDylTtzkSgdKUfOIHY8F"
BASE_URL = "https://api.tomtom.com/routing/waypointoptimization/1"
HEADERS = {"Content-Type": "application/json"}

# Load Station Prediction Model
station_model = MLP(input_size=14)
station_model.load_state_dict(torch.load(os.path.join("..", "federated_mlp.pth")))
station_model.eval()

# Load Route Cost Model
route_model = MLP(input_size=5)
route_model.load_state_dict(torch.load(os.path.join("..", "federated_route_model.pth")))
route_model.eval()

def optimize_waypoints(waypoints):
    payload = {
        "waypoints": [{"point": {"latitude": lat, "longitude": lon}} for lat, lon in waypoints],
        "options": {
            "travelMode": "car",
            "vehicleMaxSpeed": 120
        }
    }
    url = f"{BASE_URL}?key={API_KEY}"
    resp = requests.post(url, headers=HEADERS, data=json.dumps(payload))
    resp.raise_for_status()
    return resp.json()

def compute_route_features(opt_res, raw_waypoints):
    leg_summaries = opt_res["summary"]["legSummaries"]
    features = []
    for leg in leg_summaries:
        features.append([
            leg.get("travelTimeInSeconds", 0),
            leg.get("lengthInMeters", 0),
            leg.get("waitingTimeInSeconds", 0),
            leg.get("serviceTimeInSeconds", 0),
            int(leg.get("arrivalTime", "2025-01-01T00:00:00Z")[11:13])  # simplistic hour-of-day parsing
        ])
    return np.array(features).mean(axis=0)

def load_station_data():
    return np.load(os.path.join("..", "data", "raw", "station_features.npy"))

def choose_best_route(station_data, raw_routes):
    best_idx = None
    best_score = -np.inf
    for i, (sf, waypoints) in enumerate(zip(station_data, raw_routes)):
        try:
            rt_opt = optimize_waypoints(waypoints)
            rf = compute_route_features(rt_opt, waypoints)
            sf_t = torch.tensor(sf, dtype=torch.float32).unsqueeze(0)
            rf_t = torch.tensor(rf, dtype=torch.float32).unsqueeze(0)
            with torch.no_grad():
                s_score = station_model(sf_t).item()
                r_cost = route_model(rf_t).item()
            score = s_score - r_cost
            if score > best_score:
                best_score, best_idx = score, i
        except Exception as e:
            print(f"❌ Route {i} failed: {e}")
    return best_idx, best_score

if __name__ == "__main__":
    stations = load_station_data()  # (N, 14)
    coords = np.load(os.path.join("..", "data", "raw", "station_coords.npy"))  # (N, 2)
    
    # Define waypoint routes: [origin, station, destination]
    raw_routes = [
        [(19.0760, 72.8777), (lat, lon), (18.5204, 73.8567)]  # Mumbai → station → Pune
        for lat, lon in coords
    ]

    idx, score = choose_best_route(stations, raw_routes)
    print(f"\n▶️ Best Station Index: {idx}, Score: {score:.3f}")
    print(f"📍 Coordinates: {coords[idx]}")
