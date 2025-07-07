import requests
import json

# ✅ API Configuration
API_KEY = "ZlqKBSOjQlEAKDylTtzkSgdKUfOIHY8F"
BASE_URL = "https://api.tomtom.com/routing/1/calculateLongDistanceEVRoute"

def calculate_ev_route(origin, destination, vehicle_params, consumption_pairs):
    """
    Calculates a long-distance EV route including automatic charging stops.

    Parameters:
        origin (str): "lat,lon"
        destination (str): "lat,lon"
        vehicle_params (dict): Contains currentCharge, maxCharge, etc.
        consumption_pairs (list of tuples): [(speed_kmph, kWh/100km)]

    Returns:
        dict: Parsed route result
    """
    loc = f"{origin}:{destination}"
    url = f"{BASE_URL}/{loc}/json"

    query = {
        "key": API_KEY,
        "vehicleEngineType": "electric",
        "constantSpeedConsumptionInkWhPerHundredkm":
            ":".join(f"{s},{c}" for s, c in consumption_pairs),
        "currentChargeInkWh": vehicle_params["currentCharge"],
        "maxChargeInkWh": vehicle_params["maxCharge"],
        "minChargeAtChargingStopsInkWh": vehicle_params["minAtStops"],
        "minChargeAtDestinationInkWh": vehicle_params["minAtDest"],
    }

    body = {
        "chargingParameters": {
            "batteryCurve": vehicle_params["batteryCurve"],
            "chargingConnectors": vehicle_params["connectors"],
            "chargingTimeOffsetInSec": 60
        }
    }

    response = requests.post(url, params=query, json=body)
    response.raise_for_status()
    return response.json()


def extract_route_info(data):
    """Extracts human-readable summary from EV route API response."""
    summary = data["routes"][0]["summary"]
    legs = data["routes"][0]["legs"]
    return {
        "total_distance_km": summary["lengthInMeters"] / 1000,
        "total_time_min": summary["travelTimeInSeconds"] / 60,
        "charging_time_min": summary.get("totalChargingTimeInSeconds", 0) / 60,
        "legs": legs
    }


# ✅ Example usage
if __name__ == "__main__":
    origin = "12.9716,77.5946"     # Bengaluru
    destination = "12.2958,76.6394"  # Mysuru

    vehicle_params = {
        "currentCharge": 20.0,
        "maxCharge": 60.0,
        "minAtStops": 5.0,
        "minAtDest": 5.0,
        "batteryCurve": [
            {"stateOfChargeInkWh": 0, "maxPowerInkW": 100},
            {"stateOfChargeInkWh": 50, "maxPowerInkW": 100},
            {"stateOfChargeInkWh": 60, "maxPowerInkW": 50}
        ],
        "connectors": [
            {
                "currentType": "DC",
                "plugTypes": ["IEC_62196_Type_2_Outlet"],
                "efficiency": 0.9,
                "baseLoadInkW": 0.2,
                "maxPowerInkW": 100
            }
        ]
    }

    consumption_pairs = [(50, 15.0), (100, 20.0)]

    print("\n🔋 Calculating Long-Distance EV Route...")
    data = calculate_ev_route(origin, destination, vehicle_params, consumption_pairs)
    info = extract_route_info(data)

    print("\n📍 Route Summary:")
    print(f"- Distance       : {info['total_distance_km']:.1f} km")
    print(f"- Trip Time      : {info['total_time_min']:.0f} min")
    print(f"- Charging Time  : {info['charging_time_min']:.0f} min")
    print(f"- Legs           : {len(info['legs'])}")

    for i, leg in enumerate(info["legs"], 1):
        leg_sum = leg["summary"]
        stop = leg.get("chargingInformationAtEndOfLeg")
        print(f" • Leg {i}: {leg_sum['lengthInMeters']/1000:.1f} km, {leg_sum['travelTimeInSeconds']/60:.0f} min")
        if stop:
            print(f"    ➤ Charge Stop → Reach: {stop['remainingChargeAtArrivalInkWh']:.1f} kWh")
