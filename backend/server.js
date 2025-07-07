const express = require("express")
const dotenv = require("dotenv")
const cors = require("cors")
const path = require("path")

dotenv.config({ path: path.resolve(__dirname, ".env") })

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json()) // For parsing application/json

// Import routes
const stationsRoutes = require("./routes/stations")
const routeRoutes = require("./routes/route")
const trafficRoutes = require("./routes/traffic")
const predictRoutes = require("./routes/predict")

// Use routes
app.use("/api/stations", stationsRoutes)
app.use("/api/route", routeRoutes)
app.use("/api/traffic", trafficRoutes)
app.use("/api/predict", predictRoutes)

// Basic health check
app.get("/", (req, res) => {
  res.send("EVapps Backend is running!")
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
