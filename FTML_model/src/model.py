import torch
import torch.nn as nn

class EVConsumptionModel(nn.Module):
    """
    A simple MLP to predict energy (kWh) and travel time (min).
    The architecture is designed to be adaptable in a meta-learning context.
    
    Input shape: (batch_size, 6) -> [distance, traffic, elevation, speed, SoC, temp]
    Output shape: (batch_size, 2) -> [energy_kwh, time_min]
    """
    def __init__(self, input_size=6, hidden_size1=64, hidden_size2=32, output_size=2):
        super(EVConsumptionModel, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(input_size, hidden_size1),
            nn.ReLU(),
            nn.Dropout(0.1), # Add dropout for regularization
            nn.Linear(hidden_size1, hidden_size2),
            nn.ReLU(),
            nn.Linear(hidden_size2, output_size)
        )

    def forward(self, x):
        """Standard forward pass for inference or simple training."""
        return self.network(x)

    def functional_forward(self, x, weights):
        """
        A functional forward pass that uses an explicit set of weights.
        This is crucial for meta-learning algorithms like MAML.
        """
        x = nn.functional.linear(x, weights['network.0.weight'], weights['network.0.bias'])
        x = nn.functional.relu(x)
        x = nn.functional.dropout(x, p=0.1, training=self.training)
        
        x = nn.functional.linear(x, weights['network.3.weight'], weights['network.3.bias'])
        x = nn.functional.relu(x)
        
        x = nn.functional.linear(x, weights['network.5.weight'], weights['network.5.bias'])
        return x