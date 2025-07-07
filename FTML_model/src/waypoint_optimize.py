import requests
import json

API_KEY = "ZlqKBSOjQlEAKDylTtzkSgdKUfOIHY8F"
BASE_URL = "https://api.tomtom.com/routing/waypointoptimization/1"

def optimize_waypoints(coords):
    """
    coords: list of (lat, lon) tuples including origin and destination.
    Returns optimized order of waypoint indices.
    """
    waypoints = [{"point": {"latitude": lat, "longitude": lon}} for lat, lon in coords]
    payload = {
        "waypoints": waypoints,
        "options": {
            "travelMode": "car",
            "vehicleMaxSpeed": 120
        }
    }

    try:
        resp = requests.post(
            f"{BASE_URL}?key={API_KEY}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("optimizedOrder", [])
    except requests.RequestException as e:
        print("❌ Error during API call:", e)
        return []

if __name__ == "__main__":
    coords = [
        (12.93, 77.61),  # Origin
        (12.94, 77.62),  # Waypoint
        (12.95, 77.60),  # Waypoint
        (12.96, 77.63)   # Destination
    ]
    order = optimize_waypoints(coords)
    print("✅ Optimized order indices:", order)
