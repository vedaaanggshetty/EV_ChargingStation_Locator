import numpy as np
import os

# 📁 Define save path
save_dir = os.path.join("..", "data", "raw")
os.makedirs(save_dir, exist_ok=True)

# ✅ Generate 100 stations with 14 normalized features (0–1)
np.random.seed(42)
station_features = np.random.rand(100, 14).astype(np.float32)

# ✅ Generate station coordinates within India's lat-lon bounds
latitudes = np.random.uniform(8.0, 37.0, size=(100, 1))
longitudes = np.random.uniform(68.0, 97.0, size=(100, 1))
station_coords = np.hstack([latitudes, longitudes]).astype(np.float32)

# 💾 Save to correct path
np.save(os.path.join(save_dir, "station_features.npy"), station_features)
np.save(os.path.join(save_dir, "station_coords.npy"), station_coords)

# Preview
print("✅ Sample data generated and saved to 'data/raw'")
print("📊 Features preview:\n", station_features[:3])
print("📍 Coordinates preview:\n", station_coords[:3])
