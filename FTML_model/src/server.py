import flwr as fl
import torch
import os
from model import MLP
from flwr.common import parameters_to_ndarrays  # ✅ required for proper conversion

# Strategy to save final model parameters after training
class SaveModelStrategy(fl.server.strategy.FedAvg):
    def __init__(self):
        super().__init__()
        self.final_parameters = None

    def aggregate_fit(self, server_round, results, failures):
        aggregated, _ = super().aggregate_fit(server_round, results, failures)
        if aggregated:
            self.final_parameters = aggregated
        return aggregated, {}

# Server launch
if __name__ == "__main__":
    strategy = SaveModelStrategy()

    fl.server.start_server(
        server_address="localhost:8080",
        config=fl.server.ServerConfig(num_rounds=25),
        strategy=strategy,
    )

    # Save final global model if aggregation was successful
    if strategy.final_parameters:
        print("✅ Saving final global model...")

        # Convert FL parameters to model weight arrays
        final_weights = parameters_to_ndarrays(strategy.final_parameters)

        # Load into MLP and set state
        model = MLP(input_size=14)
        state_dict = model.state_dict()
        for k, v in zip(state_dict.keys(), final_weights):
            state_dict[k] = torch.tensor(v)
        model.load_state_dict(state_dict)

        # Save model to parent directory (ftml_model/)
        save_path = os.path.join("..", "federated_mlp.pth")
        torch.save(model.state_dict(), save_path)
        print(f"📦 Model saved as {save_path}")
