"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useState } from "react"

export default function PredictPage() {
  const [inputData, setInputData] = useState("")
  const [predictionResult, setPredictionResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePredict = async () => {
    setLoading(true)
    setPredictionResult(null)
    setError(null)

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: inputData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get prediction.")
      }

      const data = await response.json()
      setPredictionResult(data.prediction)
    } catch (err) {
      setError((err as any).message)
      console.error("Prediction error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-8">
        <h2 className="section-title">Predict EV Performance</h2>
        <div className="predict-form">
          <div className="form-group">
            <label htmlFor="inputData">Input Data for Prediction:</label>
            <input
              type="text"
              id="inputData"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="e.g., 'temperature:25,speed:60,distance:100'"
            />
          </div>
          <button onClick={handlePredict} disabled={loading}>
            {loading ? "Predicting..." : "Get Prediction"}
          </button>
        </div>

        {error && <div className="predict-results text-red-500">Error: {error}</div>}

        {predictionResult && (
          <div className="predict-results">
            <h3>Prediction Result:</h3>
            <p>{predictionResult}</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
