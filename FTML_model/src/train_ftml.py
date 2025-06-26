import os
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import higher
import numpy as np

# 1. Define MLP model
class EVRoutePredictor(nn.Module):
    def __init__(self, input_dim, output_dim):
        super(EVRoutePredictor, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim)
        )

    def forward(self, x):
        return self.net(x)

# 2. Load preprocessed .pkl data
def load_city_data(cities, path):
    city_data = {}
    for city in cities:
        with open(os.path.join(path, f"{city}_normalized.pkl"), "rb") as f:
            city_data[city] = pickle.load(f)
    return city_data

# 3. MAML + Federated Trainer
def train_ftml_model(city_data, meta_epochs=10, inner_steps=5, inner_lr=0.01, meta_lr=0.001, batch_size=16):
    input_dim = city_data["mumbai"]["X"].shape[1]
    output_dim = city_data["mumbai"]["y"].shape[1]

    meta_model = EVRoutePredictor(input_dim, output_dim)
    meta_optimizer = optim.Adam(meta_model.parameters(), lr=meta_lr)
    loss_fn = nn.MSELoss()

    for epoch in range(meta_epochs):
        meta_optimizer.zero_grad()
        task_losses = []

        for city, data in city_data.items():
            X = torch.tensor(data["X"], dtype=torch.float32)
            y = torch.tensor(data["y"], dtype=torch.float32)
            dataset = TensorDataset(X, y)
            loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

            try:
                batch = next(iter(loader))
            except StopIteration:
                continue

            x_batch, y_batch = batch
            x_support, x_query = x_batch[:8], x_batch[8:]
            y_support, y_query = y_batch[:8], y_batch[8:]

            model_copy = EVRoutePredictor(input_dim, output_dim)
            model_copy.load_state_dict(meta_model.state_dict())
            inner_optimizer = optim.SGD(model_copy.parameters(), lr=inner_lr)

            with higher.innerloop_ctx(model_copy, inner_optimizer, copy_initial_weights=False) as (fmodel, diffopt):
                for _ in range(inner_steps):
                    pred = fmodel(x_support)
                    loss = loss_fn(pred, y_support)
                    diffopt.step(loss)

                query_pred = fmodel(x_query)
                query_loss = loss_fn(query_pred, y_query)
                query_loss.backward()
                task_losses.append(query_loss.item())

        meta_optimizer.step()
        print(f"Epoch {epoch+1}/{meta_epochs} | Meta Loss: {np.mean(task_losses):.4f}")

    return meta_model

# 4. Save Model
def save_model(model, path="ftml_model/models/ftml_ev_maml.pt"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    torch.save(model.state_dict(), path)
    print(f"✅ Meta-model saved at: {path}")

# 5. Run It
if __name__ == "__main__":
    cities = ["mumbai", "bangalore", "delhi"]
    city_data = load_city_data(cities, path="ftml_model/data/processed")
    model = train_ftml_model(city_data)
    save_model(model)
