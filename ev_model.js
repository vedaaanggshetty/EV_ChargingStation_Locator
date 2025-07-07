const minChargeAtDestinationInkWh = 10 // kWh
const minChargeAtChargingStopsInkWh = 20

const consumptionModel = {
  vehicleWeight: 2000, // kg
  accelerationEfficiency: 0.9,
  decelerationEfficiency: 0.9,
  uphillEfficiency: 0.9,
  downhillEfficiency: 0.9,
  constantSpeedConsumptionInkWhPerHundredkm: [
    [0, 10],
    [50, 15],
    [90, 20],
    [120, 25],
  ],
  currentChargeInkWh: 50, // kWh
  maxChargeInkWh: 75, // kWh
  auxiliaryPowerInkW: 0.5, // kW
}

const chargingModes = [
  {
    type: "alternatingCurrent",
    maxPowerInkW: 22,
  },
]
