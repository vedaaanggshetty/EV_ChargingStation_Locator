import flwr as fl
import torch
import os
from model_route import MLP
from flwr.common import parameters_to_ndarrays

class SaveModelStrategy(fl.server.strategy.FedAvg):
    def __init__(self):
        super().__init__()
        self.final_parameters = None

    def aggregate_fit(self, server_round, results, failures):
        aggregated, _ = super().aggregate_fit(server_round, results, failures)
        if aggregated:
            self.final_parameters = aggregated
        return aggregated, {}

if __name__ == "__main__":
    strategy = SaveModelStrategy()

    fl.server.start_server(
        server_address="localhost:8080",
        config=fl.server.ServerConfig(num_rounds=15),
        strategy=strategy,
    )

    if strategy.final_parameters:
        print("✅ Saving final global model...")
        weights = parameters_to_ndarrays(strategy.final_parameters)

        model = MLP(input_size=5)
        state_dict = model.state_dict()
        for k, v in zip(state_dict.keys(), weights):
            state_dict[k] = torch.tensor(v)
        model.load_state_dict(state_dict)

        # Save model in ftml_model root directory
        output_path = os.path.join("..", "federated_route_model.pth")
        torch.save(model.state_dict(), output_path)
        print(f"📦 Model saved as {output_path}")
