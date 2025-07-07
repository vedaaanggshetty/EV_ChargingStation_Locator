import torch
import flwr as fl
import numpy as np
from torch.utils.data import TensorDataset, DataLoader
from model import MLP
import os

# Load data from the processed directory
X = np.load(os.path.join("data", "processed", "X_scaled.npy"))
y = np.load(os.path.join("data", "processed", "y_target.npy"))

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_data(partition, total=5):
    size = len(X) // total
    start, end = partition * size, (partition + 1) * size
    X_part = torch.tensor(X[start:end], dtype=torch.float32)
    y_part = torch.tensor(y[start:end], dtype=torch.float32).unsqueeze(1)
    return TensorDataset(X_part, y_part)

class FLClient(fl.client.NumPyClient):
    def __init__(self, model, partition):
        self.model = model.to(device)
        self.partition = partition
        self.dataset = get_data(partition)
        self.loader = DataLoader(self.dataset, batch_size=32, shuffle=True)
        self.loss_fn = torch.nn.MSELoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)

    def get_parameters(self, config):
        return [val.cpu().numpy() for val in self.model.state_dict().values()]

    def set_parameters(self, parameters):
        state_dict = self.model.state_dict()
        for k, v in zip(state_dict.keys(), parameters):
            state_dict[k] = torch.tensor(v)
        self.model.load_state_dict(state_dict, strict=True)

    def fit(self, parameters, config):
        self.set_parameters(parameters)
        self.model.train()
        for epoch in range(config.get("epochs", 3)):
            for xb, yb in self.loader:
                xb, yb = xb.to(device), yb.to(device)
                self.optimizer.zero_grad()
                pred = self.model(xb)
                loss = self.loss_fn(pred, yb)
                loss.backward()
                self.optimizer.step()
            print(f"[Client {self.partition}] Epoch {epoch+1} Loss: {loss.item():.4f}")
        return self.get_parameters(config={}), len(self.loader.dataset), {}

    def evaluate(self, parameters, config):
        self.set_parameters(parameters)
        self.model.eval()
        loss = 0.0
        with torch.no_grad():
            for xb, yb in self.loader:
                xb, yb = xb.to(device), yb.to(device)
                pred = self.model(xb)
                loss += self.loss_fn(pred, yb).item()
        avg_loss = loss / len(self.loader)
        print(f"[Client {self.partition}] Evaluation Loss: {avg_loss:.4f}")
        return avg_loss, len(self.loader.dataset), {}

if __name__ == "__main__":
    import sys
    cid = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    client = FLClient(MLP(input_size=X.shape[1]), partition=cid)
    fl.client.start_numpy_client(server_address="localhost:8080", client=client)
