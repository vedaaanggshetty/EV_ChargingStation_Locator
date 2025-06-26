# ftml_model/src/predict.py
import sys, json
import torch
from model import SimpleMLP
from utils import preprocess_route

def main():
    input_data = json.load(sys.stdin)
    features = preprocess_route(input_data)

    model = SimpleMLP(input_size=len(features))
    model.load_state_dict(torch.load("ftml_model/src/checkpoints/mumbai_model.pt"))
    model.eval()

    with torch.no_grad():
        inp = torch.tensor(features).float().unsqueeze(0)
        pred = model(inp).squeeze().tolist()

    result = {
        "optimized_route": input_data['route'],  # For now, echo input route
        "estimated_energy_kWh": pred[0],
        "estimated_time_min": pred[1]
    }

    print(json.dumps(result))

if __name__ == '__main__':
    main()
