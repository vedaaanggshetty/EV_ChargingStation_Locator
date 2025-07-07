const express = require("express")
const fetch = require("node-fetch")
const router = express.Router()

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY

// Get Traffic Incidents
router.post("/incidents", async (req, res) => {
  const { boundingBox, zoomLevel, style = "s1" } = req.body // boundingBox: { southWest: [lng, lat], northEast: [lng, lat] }

  if (!boundingBox || !boundingBox.southWest || !boundingBox.northEast) {
    return res.status(400).json({ error: "Bounding box is required for traffic incidents." })
  }

  const { southWest, northEast } = boundingBox
  const bboxParam = `${southWest[1]},${southWest[0]},${northEast[1]},${northEast[0]}` // lat1,lon1,lat2,lon2

  try {
    const response = await fetch(
      `https://api.tomtom.com/traffic/services/4/incidentDetails/${bboxParam}/10/json?key=${TOMTOM_API_KEY}&style=${style}&zoom=${zoomLevel || 10}`,
    )
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch traffic incidents")
    }
    res.json(data)
  } catch (error) {
    console.error("Error fetching traffic incidents:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get Traffic Flow Tiles (Note: This is usually handled client-side by the SDK's TrafficFlowTilesTier)
// This endpoint is more for demonstration if a server-side proxy was strictly needed,
// but the frontend directly uses the SDK for flow tiles.
router.get("/flow-tiles", async (req, res) => {
  // This endpoint is typically not needed if using TomTom's JS SDK for flow tiles directly.
  // The SDK handles tile requests.
  res.status(200).json({ message: "Traffic flow tiles are handled client-side by TomTom SDK." })
})

module.exports = router
