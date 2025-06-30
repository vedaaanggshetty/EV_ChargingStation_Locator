# import os
# import pickle
# import torch
# import torch.nn as nn
# import torch.optim as optim
# from torch.utils.data import DataLoader, TensorDataset
# import higher
# import numpy as np

# # 1. Define MLP model
# class EVRoutePredictor(nn.Module):
#     def __init__(self, input_dim, output_dim):
#         super(EVRoutePredictor, self).__init__()
#         self.net = nn.Sequential(
#             nn.Linear(input_dim, 64),
#             nn.ReLU(),
#             nn.Linear(64, 32),
#             nn.ReLU(),
#             nn.Linear(32, output_dim)
#         )

#     def forward(self, x):
#         return self.net(x)

# # 2. Load preprocessed .pkl data
# def load_city_data(cities, path):
#     city_data = {}
#     for city in cities:
#         with open(os.path.join(path, f"{city}_normalized.pkl"), "rb") as f:
#             city_data[city] = pickle.load(f)
#     return city_data

# # 3. MAML + Federated Trainer
# def train_ftml_model(city_data, meta_epochs=10, inner_steps=5, inner_lr=0.01, meta_lr=0.001, batch_size=16):
#     input_dim = city_data["mumbai"]["X"].shape[1]
#     output_dim = city_data["mumbai"]["y"].shape[1]

#     meta_model = EVRoutePredictor(input_dim, output_dim)
#     meta_optimizer = optim.Adam(meta_model.parameters(), lr=meta_lr)
#     loss_fn = nn.MSELoss()

#     for epoch in range(meta_epochs):
#         meta_optimizer.zero_grad()
#         task_losses = []

#         for city, data in city_data.items():
#             X = torch.tensor(data["X"], dtype=torch.float32)
#             y = torch.tensor(data["y"], dtype=torch.float32)
#             dataset = TensorDataset(X, y)
#             loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

#             try:
#                 batch = next(iter(loader))
#             except StopIteration:
#                 continue

#             x_batch, y_batch = batch
#             x_support, x_query = x_batch[:8], x_batch[8:]
#             y_support, y_query = y_batch[:8], y_batch[8:]

#             model_copy = EVRoutePredictor(input_dim, output_dim)
#             model_copy.load_state_dict(meta_model.state_dict())
#             inner_optimizer = optim.SGD(model_copy.parameters(), lr=inner_lr)

#             with higher.innerloop_ctx(model_copy, inner_optimizer, copy_initial_weights=False) as (fmodel, diffopt):
#                 for _ in range(inner_steps):
#                     pred = fmodel(x_support)
#                     loss = loss_fn(pred, y_support)
#                     diffopt.step(loss)

#                 query_pred = fmodel(x_query)
#                 query_loss = loss_fn(query_pred, y_query)
#                 query_loss.backward()
#                 task_losses.append(query_loss.item())

#         meta_optimizer.step()
#         print(f"Epoch {epoch+1}/{meta_epochs} | Meta Loss: {np.mean(task_losses):.4f}")

#     return meta_model

# # 4. Save Model
# def save_model(model, path="ftml_model/models/ftml_ev_maml.pt"):
#     os.makedirs(os.path.dirname(path), exist_ok=True)
#     torch.save(model.state_dict(), path)
#     print(f"✅ Meta-model saved at: {path}")

# # 5. Run It
# if __name__ == "__main__":
#     cities = ["mumbai", "bangalore", "delhi"]
#     city_data = load_city_data(cities, path="ftml_model/data/processed")
#     model = train_ftml_model(city_data)
#     save_model(model)




import torch
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
from collections import OrderedDict
import os

from .model import EVConsumptionModel
from .utils import load_processed_data

# --- Configuration ---
PROCESSED_DATA_DIR = 'data/processed'
MODEL_SAVE_PATH = 'ev_ftml_model.pt'
META_LR = 0.001
INNER_LR = 0.01
NUM_EPOCHS = 100
NUM_INNER_STEPS = 5
CLIENTS_PER_EPOCH = 5  # Must be less than or equal to total clients
K_SHOT = 10 # Number of samples for inner loop adaptation (support set)

def main():
    client_data_map = load_processed_data(PROCESSED_DATA_DIR)
    if not client_data_map:
        print(f"No processed data found in '{PROCESSED_DATA_DIR}'. Please run the preprocessing script first.")
        return
        
    client_ids = list(client_data_map.keys())

    global_model = EVConsumptionModel()
    meta_optimizer = optim.Adam(global_model.parameters(), lr=META_LR)
    loss_function = F.mse_loss

    print("\n--- Starting Federated Meta-Learning (MAML) Training ---")

    for epoch in range(NUM_EPOCHS):
        meta_optimizer.zero_grad()
        total_meta_loss = 0.0
        
        sampled_client_ids = np.random.choice(client_ids, size=CLIENTS_PER_EPOCH, replace=False)

        for client_id in sampled_client_ids:
            # Create a temporary, fast-adapting copy of the model's weights
            fast_weights = OrderedDict(global_model.named_parameters())
            
            X_client, y_client = client_data_map[client_id]['X'], client_data_map[client_id]['y']
            n_samples = X_client.shape[0]

            # Skip clients with too few samples for a support/query split
            if n_samples < 2 * K_SHOT:
                continue

            # Create support (for adaptation) and query (for evaluation) sets
            support_indices = np.random.choice(n_samples, size=K_SHOT, replace=False)
            query_indices = np.setdiff1d(np.arange(n_samples), support_indices)
            
            X_support, y_support = X_client[support_indices], y_client[support_indices]
            X_query, y_query = X_client[query_indices], y_client[query_indices]

            # Inner loop: Adapt to the client's support data
            for _ in range(NUM_INNER_STEPS):
                support_pred = global_model.functional_forward(X_support, fast_weights)
                inner_loss = loss_function(support_pred, y_support)
                
                # Compute gradients for the fast model's weights
                grads = torch.autograd.grad(inner_loss, fast_weights.values())
                
                # Update the fast weights
                fast_weights = OrderedDict(
                    (name, param - INNER_LR * grad)
                    for ((name, param), grad) in zip(fast_weights.items(), grads)
                )

            # Evaluate the adapted model on the query set to get the meta-loss
            query_pred = global_model.functional_forward(X_query, fast_weights)
            meta_loss_client = loss_function(query_pred, y_query)
            total_meta_loss += meta_loss_client

        # Average the meta-loss and backpropagate to update the global model
        average_meta_loss = total_meta_loss / CLIENTS_PER_EPOCH
        average_meta_loss.backward()
        meta_optimizer.step()
        
        if (epoch + 1) % 10 == 0:
            print(f"Epoch [{epoch+1}/{NUM_EPOCHS}], Average Meta-Loss: {average_meta_loss.item():.4f}")

    # Save the trained global model
    torch.save(global_model.state_dict(), MODEL_SAVE_PATH)
    print(f"\n--- Training Complete. Global model saved to '{MODEL_SAVE_PATH}' ---")

if __name__ == '__main__':
    # This structure allows running the script directly
    main()