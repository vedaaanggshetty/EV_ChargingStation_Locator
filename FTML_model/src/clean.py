import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import numpy as np

# Load dataset
df = pd.read_csv("detailed_ev_charging_stations.csv")

# Normalize column names
df.columns = [col.strip().lower() for col in df.columns]

# Clean and process
df['socket_count'] = df['connector types'].fillna('').apply(lambda x: len(str(x).split(';')))
df.dropna(subset=['latitude', 'longitude'], inplace=True)

label_cols = ['charger type', 'station operator', 'renewable energy source', 'maintenance frequency']
for col in label_cols:
    df[col] = LabelEncoder().fit_transform(df[col].astype(str))

def hours_available(time_range):
    try:
        start, end = time_range.split('-')
        h1 = int(start.split(':')[0])
        h2 = int(end.split(':')[0])
        return (h2 - h1) % 24
    except:
        return 8

df['availability_hours'] = df['availability'].astype(str).apply(hours_available)

# Features
features = ['latitude', 'longitude', 'charger type', 'cost (usd/kwh)', 'availability_hours',
            'distance to city (km)', 'usage stats (avg users/day)', 'station operator',
            'charging capacity (kw)', 'renewable energy source', 'reviews (rating)',
            'parking spots', 'maintenance frequency', 'socket_count']
X = df[features].copy()

# Custom target (route score)
df['route_score'] = (
    df['charging capacity (kw)'] * 0.4 +
    df['reviews (rating)'] * 0.3 +
    (1 / (df['distance to city (km)'] + 1)) * 0.3
)

y = df['route_score'].values

# Normalize and save
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)

np.save("X_scaled.npy", X_scaled)
np.save("y_target.npy", y)

print("✅ Data cleaned and saved. Shape:", X_scaled.shape)
