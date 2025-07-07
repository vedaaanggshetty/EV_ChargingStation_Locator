const express = require("express")
const { spawn } = require("child_process")
const path = require("path")
const router = express.Router()

const PYTHON_PATH = process.env.PYTHON_PATH || "python" // Default to 'python' if not set

router.post("/", async (req, res) => {
  const { data } = req.body // Input data for the Python script

  if (!data) {
    return res.status(400).json({ error: "Input data is required for prediction." })
  }

  const pythonScriptPath = path.join(__dirname, "../../FTML_model/src/predict.py")

  try {
    // Spawn a child process to execute the Python script
    const pythonProcess = spawn(PYTHON_PATH, [pythonScriptPath, data])

    let scriptOutput = ""
    let scriptError = ""

    pythonProcess.stdout.on("data", (data) => {
      scriptOutput += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      scriptError += data.toString()
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          // Assuming the Python script outputs a JSON string
          const prediction = JSON.parse(scriptOutput)
          res.json({ prediction: prediction.result || prediction }) // Adjust based on actual Python output
        } catch (parseError) {
          console.error("Error parsing Python script output:", parseError)
          res
            .status(500)
            .json({ error: "Failed to parse prediction result from Python script.", rawOutput: scriptOutput })
        }
      } else {
        console.error(`Python script exited with code ${code}`)
        console.error(`Python script error output: ${scriptError}`)
        res.status(500).json({ error: `Python script failed with code ${code}.`, details: scriptError })
      }
    })

    pythonProcess.on("error", (err) => {
      console.error("Failed to start Python process:", err)
      res.status(500).json({ error: `Failed to start Python process: ${err.message}` })
    })
  } catch (error) {
    console.error("Error executing Python script:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
