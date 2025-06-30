# ftml_model/src/predict.py
# import sys, json
# import torch
# from model import SimpleMLP
# from utils import preprocess_route

# def main():
#     input_data = json.load(sys.stdin)
#     features = preprocess_route(input_data)

#     model = SimpleMLP(input_size=len(features))
#     model.load_state_dict(torch.load("ftml_model/src/checkpoints/mumbai_model.pt"))
#     model.eval()

#     with torch.no_grad():
#         inp = torch.tensor(features).float().unsqueeze(0)
#         pred = model(inp).squeeze().tolist()

#     result = {
#         "optimized_route": input_data['route'],  # For now, echo input route
#         "estimated_energy_kWh": pred[0],
#         "estimated_time_min": pred[1]
#     }

#     print(json.dumps(result))

# if __name__ == '__main__':
#     main()

import torch
import joblib
import numpy as np
import sys
import json

from .model import EVConsumptionModel

class EVRoutePredictor:
    def __init__(self, model_path, scaler_path):
        self.model = EVConsumptionModel()
        self.model.load_state_dict(torch.load(model_path))
        self.model.eval()
        
        self.scaler = joblib.load(scaler_path)
        
        self.feature_order = ['distance_km', 'traffic', 'elevation_gain_m', 'avg_speed_kmph', 'initial_soc', 'temperature_c']

    def _prepare_input_tensor(self, segment_data, ev_state):
        combined_data = {**segment_data, **ev_state}
        feature_vector = [combined_data[key] for key in self.feature_order]
        scaled_features = self.scaler.transform(np.array(feature_vector).reshape(1, -1))
        return torch.tensor(scaled_features, dtype=torch.float32)

    def predict_trip_metrics(self, route_segments, initial_ev_state):
        total_energy_kwh, total_time_min = 0.0, 0.0
        current_soc = initial_ev_state['initial_soc']
        battery_capacity_kwh = initial_ev_state.get('battery_capacity_kwh', 50) # Default 50kWh

        with torch.no_grad():
            for segment in route_segments:
                ev_state_for_segment = {'initial_soc': current_soc, 'temperature_c': initial_ev_state['temperature_c']}
                input_tensor = self._prepare_input_tensor(segment, ev_state_for_segment)
                
                predicted_energy, predicted_time = self.model(input_tensor).squeeze().tolist()
                
                total_energy_kwh += predicted_energy
                total_time_min += predicted_time
                current_soc -= (predicted_energy / battery_capacity_kwh) * 100

        return {
            "total_predicted_energy_kwh": round(total_energy_kwh, 2),
            "total_predicted_time_min": round(total_time_min, 2),
            "final_predicted_soc": round(current_soc, 2)
        }

def main():
    """
    Main execution block to be called from Node.js.
    Reads input from stdin and prints JSON output to stdout.
    """
    # Load input data passed from the Node.js script
    input_data = json.load(sys.stdin)
    
    route_segments = input_data['route_segments']
    initial_ev_state = input_data['initial_ev_state']

    # Paths to the trained model and scaler
    MODEL_PATH = 'ev_ftml_model.pt'
    SCALER_PATH = 'data/ev_feature_scaler.pkl'
    
    predictor = EVRoutePredictor(model_path=MODEL_PATH, scaler_path=SCALER_PATH)
    prediction_result = predictor.predict_trip_metrics(route_segments, initial_ev_state)
    
    # Print the final result as a JSON string to stdout
    print(json.dumps(prediction_result))

if __name__ == '__main__':
    main()