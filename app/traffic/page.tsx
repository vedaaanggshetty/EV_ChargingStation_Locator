"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useTomTomMap } from "@/hooks/use-tomtom-map"
import { useRef, useState, useEffect } from "react"

const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "YOUR_TOMTOM_API_KEY"

export default function TrafficPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const map = useTomTomMap(mapContainerRef, TOMTOM_API_KEY, { center: [52.37187, 4.89218], zoom: 13 }) // Amsterdam
  const [trafficFlowEnabled, setTrafficFlowEnabled] = useState(false)
  const [trafficIncidentsEnabled, setTrafficIncidentsEnabled] = useState(false)
  const [incidentList, setIncidentList] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [searchBoxInstance, setSearchBoxInstance] = useState<any>(null)

  const styleBase = "tomtom://vector/1/"
  const styleS1 = "s1"
  const styleRelative = "relative"
  const refreshTimeInMillis = 30000
  const popupHideDelayInMillis = 4000

  const iconsMapping = [
    "danger",
    "accident",
    "fog",
    "danger",
    "rain",
    "ice",
    "incident",
    "laneclosed",
    "roadclosed",
    "roadworks",
    "wind",
    "flooding",
    "detour",
    "hospital",
  ]
  const delayMagnitudeMapping = ["unknown", "minor", "moderate", "major", "undefined"]

  // State for bounding box drawing
  const [drawBoundingBoxMode, setDrawBoundingBoxMode] = useState(false)
  const [mousePressed, setMousePressed] = useState(false)
  const startCornerLngLat = useRef<any>(null)
  const endCornerLngLat = useRef<any>(null)
  const layerFillID = "layerFillID"
  const layerOutlineID = "layerOutlineID"
  const sourceID = "sourceID"

  const showPopup = (element: HTMLElement) => {
    element.style.opacity = "0.9"
  }

  const hidePopup = (delayInMillis: number) => {
    const element = document.getElementById("popup-wrapper")
    if (!element) return
    if (delayInMillis === 0) {
      element.style.opacity = "0"
    } else {
      setTimeout(() => {
        element.style.opacity = "0"
      }, delayInMillis)
    }
  }

  const getPopupInnerHTML = (popupClass: string, popupMessage: string) => {
    return `<div class="container ${popupClass} popup">
      <div class="row">
        <div class="col py-2">
          <div class="row align-items-center pt-1">
            <div class="col-sm-1">
              <img src="/images/error-symbol.png" alt=""/>
            </div>
            <div id="popup-message" class="col">${popupMessage}</div>
          </div>
        </div>
      </div>
    </div>`
  }

  const showInfoPopup = (msg: string) => {
    const popupElementDiv = document.getElementById("popup-wrapper")
    if (!popupElementDiv) return
    popupElementDiv.innerHTML = getPopupInnerHTML("popup-info", msg)
    showPopup(popupElementDiv)
  }

  const showErrorPopup = (msg: string) => {
    const popupElementDiv = document.getElementById("popup-wrapper")
    if (!popupElementDiv) return
    popupElementDiv.innerHTML = getPopupInnerHTML("popup-error", msg)
    showPopup(popupElementDiv)
  }

  const removeBoundingBox = () => {
    if (map && map.getSource(sourceID)) {
      if (map.getLayer(layerFillID)) map.removeLayer(layerFillID)
      if (map.getLayer(layerOutlineID)) map.removeLayer(layerOutlineID)
      map.removeSource(sourceID)
    }
  }

  const getPolygonSourceData = (start: any, end: any) => {
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [start.lng, start.lat],
            [start.lng, end.lat],
            [end.lng, end.lat],
            [end.lng, start.lat],
            [start.lng, start.lat],
          ],
        ],
      },
    }
  }

  const updateRectangleData = (start: any, end: any) => {
    if (map && map.getSource(sourceID)) {
      map.getSource(sourceID).setData(getPolygonSourceData(start, end))
    }
  }

  const getLngLatBoundsForIncidentDetailsCall = (start: any, end: any) => {
    const bottomLeftCorner = new window.tt.LngLat(
      start.lng < end.lng ? start.lng : end.lng,
      start.lat < end.lat ? start.lat : end.lat
    )
    const topRightCorner = new window.tt.LngLat(
      start.lng > end.lng ? start.lng : end.lng,
      start.lat > end.lat ? start.lat : end.lat
    )
    return window.tt.LngLatBounds.convert([bottomLeftCorner.toArray(), topRightCorner.toArray()])
  }

  const bothLngLatAreDifferent = (lngLat1: any, lngLat2: any) => {
    return lngLat1.lat !== lngLat2.lat && lngLat1.lng !== lngLat2.lng
  }

  const onMouseDown = (eventDetails: any) => {
    if (drawBoundingBoxMode) {
      eventDetails.preventDefault()
      setMousePressed(true)
      startCornerLngLat.current = eventDetails.lngLat
      removeBoundingBox()
      if (map) {
        map.addSource(sourceID, {
          type: "geojson",
          data: getPolygonSourceData(startCornerLngLat.current, startCornerLngLat.current),
        })

        map.addLayer({
          id: layerFillID,
          type: "fill",
          source: sourceID,
          layout: {},
          paint: {
            "fill-color": "#666",
            "fill-opacity": 0.1,
          },
        })

        map.addLayer({
          id: layerOutlineID,
          type: "line",
          source: sourceID,
          layout: {},
          paint: {
            "line-width": 4,
            "line-color": "#424242",
            "line-dasharray": [2, 1],
            "line-blur": 0.5,
          },
        })
      }
    }
  }

  const onMouseMove = (eventDetails: any) => {
    if (mousePressed) {
      endCornerLngLat.current = eventDetails.lngLat
      updateRectangleData(startCornerLngLat.current, endCornerLngLat.current)
    }
  }

  const onMouseUp = (eventDetails: any) => {
    setMousePressed(false)
    hidePopup(0)
    if (drawBoundingBoxMode) {
      endCornerLngLat.current = eventDetails.lngLat
      if (bothLngLatAreDifferent(startCornerLngLat.current, endCornerLngLat.current)) {
        updateRectangleData(startCornerLngLat.current, endCornerLngLat.current)
        setIncidentList([])
        displayTrafficIncidents(getLngLatBoundsForIncidentDetailsCall(startCornerLngLat.current, endCornerLngLat.current))
        setTrafficIncidentsEnabled(true)
      } else {
        showErrorPopup("Try to select a bigger bounding box.")
        hidePopup(popupHideDelayInMillis)
      }
      setDrawBoundingBoxMode(false)
    }
  }

  const displayTrafficIncidents = async (boundingBox: any) => {
    setMessage("Fetching traffic incidents...")
    try {
      const response = await fetch("/api/traffic/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boundingBox: {
            southWest: boundingBox.getSouthWest().toArray(),
            northEast: boundingBox.getNorthEast().toArray(),
          },
          zoomLevel: map.getZoom(),
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const results = await response.json()

      if (results.tm.poi.length === 0) {
        showErrorPopup("There are no traffic incidents in this area.")
        hidePopup(popupHideDelayInMillis)
        setIncidentList([])
      } else {
        setIncidentList(results.tm.poi)
        setMessage(`Found ${results.tm.poi.length} traffic incidents.`)
      }
    } catch (error: any) {
      setMessage(`Error fetching traffic incidents: ${error.message}`)
      console.error("Error fetching traffic incidents:", error)
      setIncidentList([])
    }
  }

  const getButtonIncidentContent = (
    description: string,
    iconCategory: string,
    delayMagnitude: string,
    fromAddress: string,
    toAddress: string
  ) => {
    return (
      <div className="row align-items-center pb-2">
        <div className="col-sm-2">
          <div className="tt-traffic-icon">
            <div className={`tt-icon-circle-${delayMagnitude} traffic-icon`}>
              <div className={`tt-icon-${iconCategory}`}></div>
            </div>
          </div>
        </div>
        <div className="col label pl-0">{description}</div>
        <div className="row">
          <div className="col-sm-2">
            <label className="label">From: </label>
          </div>
          <div className="col">
            <label className="incident-details-list-normal-text">{fromAddress}</label>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-2">
            <label className="label">To: </label>
          </div>
          <div className="col">
            <label className="incident-details-list-normal-text">{toAddress}</label>
          </div>
        </div>
      </div>
    )
  }

  const getButtonClusterContent = (description: string, numberOfIncidents: number, delayMagnitude: string) => {
    return (
      <div className="row align-items-center pb-2">
        <div className="col-sm-2">
          <div className="tt-traffic-icon">
            <div className={`tt-icon-circle-${delayMagnitude} traffic-icon`}>
              <div id="cluster-icon" className="tt-icon-number">
                {numberOfIncidents}
              </div>
            </div>
          </div>
        </div>
        <div className="col label pl-0">{description}</div>
      </div>
    )
  }

  useEffect(() => {
    if (map && window.tt && window.tt.plugins && window.tt.plugins.SearchBox) {
      const commonSearchBoxOptions = {
        key: TOMTOM_API_KEY,
        center: map.getCenter(),
      }

      const searchBox = new window.tt.plugins.SearchBox(window.tt.services, {
        minNumberOfCharacters: 0,
        labels: {
          placeholder: "Search",
        },
        noResultsMessage: "No results found.",
        searchOptions: commonSearchBoxOptions,
        autocompleteOptions: commonSearchBoxOptions,
      })

      searchBox.on("tomtom.searchbox.resultselected", (result: any) => {
        map.flyTo({
          center: result.data.result.position,
          speed: 3,
        })
      })

      const searchPanel = document.getElementById("search-panel")
      if (searchPanel) {
        searchPanel.innerHTML = "" // Clear previous content
        searchPanel.append(searchBox.getSearchBoxHTML())
      }
      setSearchBoxInstance(searchBox)

      map.on("mousedown", onMouseDown)
      map.on("mouseup", onMouseUp)
      map.on("mousemove", onMouseMove)
      map.on("moveend", () => {
        if (searchBoxInstance) {
          const updatedOptions = Object.assign(commonSearchBoxOptions, {
            center: map.getCenter(),
          })
          searchBoxInstance.updateOptions({
            minNumberOfCharacters: 0,
            searchOptions: updatedOptions,
            autocompleteOptions: updatedOptions,
          })
        }
      })

      return () => {
        map.off("mousedown", onMouseDown)
        map.off("mouseup", onMouseUp)
        map.off("mousemove", onMouseMove)
        map.off("moveend", () => {
          if (searchBoxInstance) {
            searchBoxInstance.updateOptions({}) // Clear options
          }
        })
        if (searchBoxInstance) {
          searchBoxInstance.off("tomtom.searchbox.resultselected")
        }
      }
    }
  }, [map]) // Re-run when map object is available

  useEffect(() => {
    if (!map) return

    const trafficFlowTilesTier = new window.tt.TrafficFlowTilesTier({
      key: TOMTOM_API_KEY,
      style: styleBase + styleRelative,
      refresh: refreshTimeInMillis,
    })

    const trafficIncidentsTier = new window.tt.TrafficIncidentTier({
      key: TOMTOM_API_KEY,
      incidentDetails: {
        style: styleS1,
      },
      incidentTiles: {
        style: styleBase + styleS1,
      },
      refresh: refreshTimeInMillis,
    })

    if (trafficFlowEnabled) {
      map.addTier(trafficFlowTilesTier)
    } else {
      map.removeTier(trafficFlowTilesTier.getId())
    }

    if (trafficIncidentsEnabled) {
      map.addTier(trafficIncidentsTier)
    } else {
      map.removeTier(trafficIncidentsTier.getId())
    }

    return () => {
      map.removeTier(trafficFlowTilesTier.getId())
      map.removeTier(trafficIncidentsTier.getId())
    }
  }, [map, trafficFlowEnabled, trafficIncidentsEnabled])

  return (
    <>
      <Navbar />
      <main className="container py-8">
        <h2 className="section-title">Check Traffic</h2>
        <div className="map-controls">
          <div id="search-panel" className="w-full">
            {/* SearchBox will be rendered here by TomTom plugin */}
          </div>
          <button onClick={() => setDrawBoundingBoxMode(true)}>Draw Bounding Box for Incidents</button>
        </div>
        <div className="traffic-controls">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="flow-toggle"
              checked={trafficFlowEnabled}
              onChange={(e) => setTrafficFlowEnabled(e.target.checked)}
            />
            <label htmlFor="flow-toggle">Show Traffic Flow</label>
          </div>
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="incidents-toggle"
              checked={trafficIncidentsEnabled}
              onChange={(e) => setTrafficIncidentsEnabled(e.target.checked)}
            />
            <label htmlFor="incidents-toggle">Show Traffic Incidents</label>
          </div>
        </div>
        {message && <p className="map-summary">{message}</p>}
        <div className="map-container">
          <div id="map" ref={mapContainerRef} />
        </div>
        <div id="popup-wrapper" className="popup-wrapper"></div> {/* Popups will be rendered here */}
        <div className="traffic-incident-list">
          <h3>Traffic Incidents in Area</h3>
          {incidentList.length === 0 ? (
            <p>No incidents to display. Draw a bounding box or enable incident layer.</p>
          ) : (
            incidentList.map((incident, index) => (
              <button
                key={index}
                className="list-group-item list-group-item-action incidendDetailsListItemButton"
                onClick={() => map.flyTo({ center: incident.p })}
              >
                {incident.id.includes("CLUSTER")
                  ? getButtonClusterContent(incident.id, incident.cs, delayMagnitudeMapping[incident.ty])
                  : getButtonIncidentContent(
                      incident.d.toUpperCase(),
                      iconsMapping[incident.ic],
                      delayMagnitudeMapping[incident.ty],
                      incident.f,
                      incident.t
                    )}
              </button>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
