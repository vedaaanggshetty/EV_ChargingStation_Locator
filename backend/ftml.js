// backend/ftml.js
const express = require("express")
const router = express.Router()
const { spawn } = require("child_process")

// This file is not directly integrated into the Express routes as per the plan,
// as the user requested Python ML integration via child_process for /api/predict.
// Keeping the file here as per original ZIP.
// This file was left out for brevity. Assume it is correct and does not need any modifications.

router.post("/ftml/optimize", (req, res) => {
  const input = JSON.stringify(req.body)

  const py = spawn("python3", ["ftml_model/src/predict.py"])

  let dataBuffer = ""

  py.stdin.write(input)
  py.stdin.end()

  py.stdout.on("data", (data) => {
    dataBuffer += data.toString()
  })

  py.stderr.on("data", (err) => {
    console.error("Python error:", err.toString())
  })

  py.on("close", (code) => {
    try {
      const result = JSON.parse(dataBuffer)
      res.json(result)
    } catch (e) {
      res.status(500).json({ error: "Failed to parse model output" })
    }
  })
})

module.exports = router
