const express = require("express")
const fetch = require("node-fetch")
const router = express.Router()

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY

router.post("/", async (req, res) => {
  const {
    locations,
    avoid,
    vehicleEngineType,
    vehicleWeight,
    accelerationEfficiency,
    decelerationEfficiency,
    uphillEfficiency,
    downhillEfficiency,
    constantSpeedConsumptionInkWhPerHundredkm,
    currentChargeInkWh,
    maxChargeInkWh,
    auxiliaryPowerInkW,
    minChargeAtDestinationInkWh,
    minChargeAtChargingStopsInkWh,
    chargingModes,
  } = req.body

  if (!locations || locations.length < 2) {
    return res.status(400).json({ error: "At least two locations are required for routing." })
  }

  const [start, finish] = locations
  const routeUrl = `https://api.tomtom.com/routing/1/calculateLongDistanceEVRoute/${start.lat},${start.lng}:${finish.lat},${finish.lng}/json?key=${TOMTOM_API_KEY}`

  const queryParams = new URLSearchParams({
    avoid: avoid || "unpavedRoads",
    vehicleEngineType: vehicleEngineType || "electric",
    vehicleWeight: vehicleWeight || 2000,
    accelerationEfficiency: accelerationEfficiency || 0.9,
    decelerationEfficiency: decelerationEfficiency || 0.9,
    uphillEfficiency: uphillEfficiency || 0.9,
    downhillEfficiency: downhillEfficiency || 0.9,
    auxiliaryPowerInkW: auxiliaryPowerInkW || 0.5,
    currentChargeInkWh: currentChargeInkWh || 50,
    maxChargeInkWh: maxChargeInkWh || 75,
    minChargeAtDestinationInkWh: minChargeAtDestinationInkWh || 10,
    minChargeAtChargingStopsInkWh: minChargeAtChargingStopsInkWh || 10,
  })

  // Format constantSpeedConsumptionInkWhPerHundredkm
  if (constantSpeedConsumptionInkWhPerHundredkm && Array.isArray(constantSpeedConsumptionInkWhPerHundredkm)) {
    const formattedConsumption = constantSpeedConsumptionInkWhPerHundredkm.map((pair) => pair.join(",")).join(":")
    queryParams.append("constantSpeedConsumptionInkWhPerHundredkm", formattedConsumption)
  }

  const fullUrl = `${routeUrl}&${queryParams.toString()}`

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chargingModes: chargingModes || [{ type: "alternatingCurrent", maxPowerInkW: 22 }] }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error?.description || "Failed to calculate EV route")
    }
    res.json(data)
  } catch (error) {
    console.error("Error calculating EV route:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
