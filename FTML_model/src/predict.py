import sys
import json

def main():
    """
    This script takes input data as a command-line argument (or from stdin)
    and returns a dummy prediction.
    In a real scenario, this would load a model and make a prediction.
    """
    if len(sys.argv) > 1:
        input_data = sys.argv[1]
    else:
        # Read from stdin if no command-line argument is provided
        input_data = sys.stdin.read().strip()

    # Simulate a prediction based on input_data
    # In a real application, you would load your model (e.g., from federated_mlp.pth)
    # and use it to make a prediction based on the parsed input_data.
    # For example:
    # import torch
    # from model import MLP  # Assuming model.py defines MLP
    # model = MLP(...)
    # model.load_state_dict(torch.load('federated_mlp.pth'))
    # processed_input = preprocess(input_data)
    # prediction = model(processed_input).item()

    if "temperature" in input_data and "speed" in input_data:
        # Simple heuristic for demonstration
        try:
            temp_str = input_data.split("temperature:")[1].split(",")[0]
            speed_str = input_data.split("speed:")[1].split(",")[0]
            temp = float(temp_str)
            speed = float(speed_str)
            
            # Dummy prediction logic: higher temp/speed -> higher consumption
            consumption = (temp * 0.1) + (speed * 0.2) + 5
            prediction_result = f"Predicted consumption: \{consumption:.2f\} kWh/100km"
        except ValueError:
            prediction_result = f"Invalid input format. Received: \{input_data\}"
    else:
        prediction_result = f"Dummy prediction for input: '\{input_data\}'. (Model not integrated)"

    # Output the result as JSON
    print(json.dumps(\{"result": prediction_result\}))

if __name__ == "__main__":
    main()
