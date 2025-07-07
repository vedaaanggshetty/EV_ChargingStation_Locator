import torch
import numpy as np
import os
from model_route import MLP  # Make sure this exists in src/

# 📂 Load route features from correct path
data_path = os.path.join("..", "data", "processed", "X_route.npy")
X_test = np.load(data_path)
print("✅ Test shape:", X_test.shape)

# 🔧 Initialize model and load weights
model_path = os.path.join("..", "federated_route_model.pth")
model = MLP(input_size=5)
model.load_state_dict(torch.load(model_path))
model.eval()

# 🔮 Predict route scores
with torch.no_grad():
    inputs = torch.tensor(X_test, dtype=torch.float32)
    preds = model(inputs).squeeze().numpy()

# 📊 Sort by most optimal (lowest cost)
sorted_routes = sorted(enumerate(preds, start=450), key=lambda x: x[1])  # Assuming 450–1000 are route IDs

print("\n🏆 Top 10 Most Optimal Routes:")
for i, (route_idx, score) in enumerate(sorted_routes[:10], start=1):
    print(f"{i}. Route {route_idx}: {score:.3f}")
