import pandas as pd
import torch
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json

def load_and_normalize_data(raw_data_dir, processed_data_dir, scaler_path):
    """
    Loads all raw JSON files, combines them, fits a scaler,
    normalizes the data, and saves processed files for each client.
    """
    all_dfs = []
    # Loop through all JSON files in the raw data directory
    for filename in os.listdir(raw_data_dir):
        if filename.endswith('.json'):
            city_name = filename.split('_')[0]
            filepath = os.path.join(raw_data_dir, filename)
            with open(filepath, 'r') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
            df['city'] = city_name # Use the filename to create a client ID
            all_dfs.append(df)

    if not all_dfs:
        print("No raw JSON data found. Aborting.")
        return None, None
        
    combined_df = pd.concat(all_dfs, ignore_index=True)
    
    # IMPORTANT: The feature order must be consistent everywhere!
    feature_cols = ['distance_km', 'traffic', 'elevation_gain_m', 'avg_speed_kmph', 'initial_soc', 'temperature_c']
    label_cols = ['energy_kwh', 'time_min']
    
    X = combined_df[feature_cols]
    
    # Fit the scaler on ALL data to ensure a consistent scale
    scaler = StandardScaler()
    scaler.fit(X)
    joblib.dump(scaler, scaler_path)
    print(f"Feature scaler saved to '{scaler_path}'")
    
    # Process and save data for each city (client)
    client_data_map = {}
    for city_name, group in combined_df.groupby('city'):
        X_city = group[feature_cols]
        y_city = group[label_cols]
        
        X_city_scaled = scaler.transform(X_city)
        
        X_tensor = torch.tensor(X_city_scaled, dtype=torch.float32)
        y_tensor = torch.tensor(y_city.values, dtype=torch.float32)
        
        client_data = {'X': X_tensor, 'y': y_tensor}
        
        # Save processed data as a pickle file
        processed_filepath = os.path.join(processed_data_dir, f"{city_name}_normalized.pkl")
        torch.save(client_data, processed_filepath)
        print(f"Saved processed data for '{city_name}' to '{processed_filepath}'")
        
        client_data_map[city_name] = client_data
        
    return client_data_map

def load_processed_data(processed_data_dir):
    """Loads all pre-normalized client data from pickle files."""
    client_data_map = {}
    if not os.path.exists(processed_data_dir):
        return client_data_map

    for filename in os.listdir(processed_data_dir):
        if filename.endswith('.pkl'):
            city_name = filename.split('_')[0]
            filepath = os.path.join(processed_data_dir, filename)
            client_data_map[city_name] = torch.load(filepath)
    return client_data_map