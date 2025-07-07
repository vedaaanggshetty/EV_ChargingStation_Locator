"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useTomTomMap } from "@/hooks/use-tomtom-map"
import { useRef, useState } from "react"

const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "YOUR_TOMTOM_API_KEY"

// EV Model parameters (from ev_model.js)
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

const minChargeAtDestinationInkWh = 10 // kWh

export default function EvRoutingPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const map = useTomTomMap(mapContainerRef, TOMTOM_API_KEY, { center: [52.37187, 4.89218], zoom: 13 })
  const [startLocationQuery, setStartLocationQuery] = useState("Amsterdam")
  const [finishLocationQuery, setFinishLocationQuery] = useState("Berlin")
  const [routeSummary, setRouteSummary] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [markers, setMarkers] = useState<any[]>([])

  const ids = {
    route: {
      source: "routeSource",
      layer: "routeLayer",
    },
  }

  const appearance = {
    marker: {
      color: {
        start: "green",
        finish: "red",
        leg: "blue",
      },
    },
    line: {
      color: "#224488",
      width: 6,
      padding: 40,
      join: "round",
      cap: "round",
    },
  }

  const labels = {
    lengthInMeters: "Travel Distance (km)",
    travelTimeInSeconds: "Travel Time",
    trafficDelayInSeconds: "Traffic Delay",
    batteryConsumptionInkWh: "Battery Consumption (kWh)",
    remainingChargeAtArrivalInkWh: "Remaining Charge (kWh)",
    totalChargingTimeInSeconds: "Total Charging Time",
    targetChargeInkWh: "Target Charge (kWh)",
    chargingTimeInSeconds: "Charging Time",
    routeSummary: "Route Summary",
    legSummary: "Route Leg #",
  }

  const units = {
    metersPerKilometer: 1000,
    secondsPerMinute: 60,
    secondsPerHour: 3600,
  }

  const formatMetersToKilometers = (meters: number) => (meters / units.metersPerKilometer).toFixed(3)

  const formatSecondsToTime = (seconds: number) => {
    const hours = Math.floor(seconds / units.secondsPerHour)
    seconds -= hours * units.secondsPerHour
    const minutes = Math.floor(seconds / units.secondsPerMinute)
    seconds -= minutes * units.secondsPerMinute
    return `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const formatFixedDecimal = (value: number) => value.toFixed(4)

  const clearRoute = () => {
    markers.forEach((marker) => marker.remove())
    setMarkers([])
    setRouteSummary(null)
    if (map && map.getSource(ids.route.source)) {
      map.removeLayer(ids.route.layer)
      map.removeSource(ids.route.source)
    }
  }

  const addMarker = (position: { lng: number; lat: number }, color: string) => {
    if (!map || !window.tt) return
    const marker = new window.tt.Marker({ color }).setLngLat(position).addTo(map)
    setMarkers((prev) => [...prev, marker])
  }

  const addRoute = (geoJson: any) => {
    if (!map || !window.tt) return
    setMessage("Adding route to map...")

    if (map.getSource(ids.route.source)) {
      map.removeLayer(ids.route.layer)
      map.removeSource(ids.route.source)
    }

    map.addSource(ids.route.source, { type: "geojson", data: geoJson })
    map.addLayer({
      id: ids.route.layer,
      type: "line",
      source: ids.route.source,
      layout: { "line-join": appearance.line.join, "line-cap": appearance.line.cap },
      paint: { "line-color": appearance.line.color, "line-width": appearance.line.width },
    })
  }

  const appendSummary = (properties: any, heading: string) => {
    const summaryItems: { label: string; value: string }[] = []

    const appendProperty = (label: string, name: string, format?: (value: any) => string) => {
      if (properties.hasOwnProperty(name)) {
        summaryItems.push({
          label,
          value: format ? format(properties[name]) : properties[name].toString(),
        })
      }
    }

    appendProperty(labels.lengthInMeters, "lengthInMeters", formatMetersToKilometers)
    appendProperty(labels.travelTimeInSeconds, "travelTimeInSeconds", formatSecondsToTime)
    appendProperty(labels.trafficDelayInSeconds, "trafficDelayInSeconds", formatSecondsToTime)
    appendProperty(labels.batteryConsumptionInkWh, "batteryConsumptionInkWh", formatFixedDecimal)
    appendProperty(labels.remainingChargeAtArrivalInkWh, "remainingChargeAtArrivalInkWh", formatFixedDecimal)
    appendProperty(labels.totalChargingTimeInSeconds, "totalChargingTimeInSeconds", formatSecondsToTime)

    if (properties.hasOwnProperty("chargingInformationAtEndOfLeg")) {
      appendProperty(labels.targetChargeInkWh, "targetChargeInkWh", formatFixedDecimal)
      appendProperty(labels.chargingTimeInSeconds, "chargingTimeInSeconds", formatSecondsToTime)
    }

    return { heading, items: summaryItems }
  }

  const calculateRoute = async () => {
    if (!map) {
      setMessage("Map is still loading. Please try again.")
      return
    }

    clearRoute()
    setMessage("Finding start and finish locations...")

    try {
      const startRes = await fetch(`/api/stations/fuzzy-search?query=${encodeURIComponent(startLocationQuery)}`)
      const startData = await startRes.json()

      if (!startRes.ok || !startData.results || startData.results.length === 0)
        throw new Error(`Could not find start location (${startLocationQuery}).`)

      const startLocation = startData.results[0]

      const finishRes = await fetch(`/api/stations/fuzzy-search?query=${encodeURIComponent(finishLocationQuery)}`)
      const finishData = await finishRes.json()

      if (!finishRes.ok || !finishData.results || finishData.results.length === 0)
        throw new Error(`Could not find finish location (${finishLocationQuery}).`)

      const finishLocation = finishData.results[0]

      setMessage("Calculating route...")

      const routeRes = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: [startLocation.position, finishLocation.position],
          vehicleEngineType: "electric",
          vehicleWeight: consumptionModel.vehicleWeight,
          currentChargeInkWh: consumptionModel.currentChargeInkWh,
          maxChargeInkWh: consumptionModel.maxChargeInkWh,
          minChargeAtDestinationInkWh,
        }),
      })

      if (!routeRes.ok) {
        const errorText = await routeRes.text()
        setMessage(`Error from server: ${errorText || "Unknown error"}`)
        throw new Error(errorText || "Unknown error calculating route.")
      }

      const routeData = await routeRes.json()

      if (!routeData || !routeData.routes || routeData.routes.length === 0) {
        setMessage("No suitable route was found.")
        return
      }

      const route = routeData.routes[0]
      const geoJson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: route.legs.flatMap((leg: any) =>
                leg.points.map((p: any) => [p.longitude, p.latitude])
              ),
            },
          },
        ],
      }

      addRoute(geoJson)
      addMarker(startLocation.position, appearance.marker.color.start)
      addMarker(finishLocation.position, appearance.marker.color.finish)

      const bounds = new window.tt.LngLatBounds()
      bounds.extend([startLocation.position.lng, startLocation.position.lat])
      bounds.extend([finishLocation.position.lng, finishLocation.position.lat])
      geoJson.features[0].geometry.coordinates.forEach((coord: [number, number]) => bounds.extend(coord))
      map.fitBounds(bounds, { padding: appearance.line.padding })

      const summaryData: any[] = []
      summaryData.push(appendSummary(route.summary, labels.routeSummary))
      route.legs.forEach((leg: any, index: number) => {
        summaryData.push(appendSummary(leg.summary, `${labels.legSummary}${index + 1}`))
      })
      setRouteSummary(summaryData)
      setMessage("Route calculated successfully!")
    } catch (error: any) {
      setMessage(`Error calculating route: ${error.message}`)
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-8">
        <h2 className="section-title">Route to Station</h2>
        <div className="map-controls">
          <input
            type="text"
            placeholder="Start Location (e.g., Amsterdam)"
            value={startLocationQuery}
            onChange={(e) => setStartLocationQuery(e.target.value)}
          />
          <input
            type="text"
            placeholder="Finish Location (e.g., Berlin)"
            value={finishLocationQuery}
            onChange={(e) => setFinishLocationQuery(e.target.value)}
          />
          <button onClick={calculateRoute}>Calculate Route</button>
        </div>
        {message && <p className="map-summary">{message}</p>}
        <div className="map-container">
          <div id="map" ref={mapContainerRef} />
        </div>
        {routeSummary && (
          <div className="map-summary">
            {routeSummary.map((summaryBlock: any, blockIndex: number) => (
              <div key={blockIndex} className="mb-4">
                <h3>{summaryBlock.heading}</h3>
                {summaryBlock.items.map((item: any, itemIndex: number) => (
                  <span key={itemIndex}>
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
