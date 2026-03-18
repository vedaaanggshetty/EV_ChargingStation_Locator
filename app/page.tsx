"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Zap,
  Navigation,
  Search,
  Target,
  Trophy,
  AlertTriangle,
  Route,
  CheckCircle2,
  Cpu,
  ArrowRight,
  ChevronRight,
  Clock, // newly added
  Loader2
} from "lucide-react"

export default function EVChargingApp() {
  const [userLocation, setUserLocation] = useState<any>(null)
  const [stations, setStations] = useState<any[]>([])
  const [algorithmResults, setAlgorithmResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [address, setAddress] = useState("")
  const [distance, setDistance] = useState("")
  const [demoMode, setDemoMode] = useState(false)

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Route metrics from TomTom
  const [routeMetrics, setRouteMetrics] = useState<any>(null)
  const [tomtomKey, setTomtomKey] = useState("")

  useEffect(() => {
    // Save API key client side
    setTomtomKey(process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "")
    
    // Closer handling for autocomplete
    function handleClickOutside(event: any) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle address input and fetch autocomplete
  async function handleAddressChange(e: any) {
    const val = e.target.value
    setAddress(val)
    if (val.length > 2) {
      try {
        const res = await fetch(`/api/suggestions?query=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      } catch (err) {
        console.error("Failed to fetch suggestions:", err)
      }
    } else {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  // Handle autocomplete selection
  async function handleSelectSuggestion(suggestion: any) {
    setAddress(suggestion.text)
    setShowSuggestions(false)
    const location = { lat: suggestion.lat, lng: suggestion.lng }
    setUserLocation(location)
    await findStationsAndAnalyze(location, distance)
  }

  // Get user's current location via browser
  async function getCurrentLocation() {
    setLoading(true)
    setError("")

    try {
      const position = await new Promise<any>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      })

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      setUserLocation(location)
      setAddress("Current Location")
      await findStationsAndAnalyze(location, distance)
    } catch (err) {
      setError("Could not get your location. Please enter an address manually.")
    }
    setLoading(false)
  }

  // Fallback direct text search
  async function searchAddress() {
    if (!address.trim()) {
      setError("Please enter an address")
      return
    }

    setLoading(true)
    setError("")
    setDemoMode(false)
    setShowSuggestions(false)

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      if (data.address && data.address.includes("(Demo Location)")) {
        setDemoMode(true)
      }

      const location = { lat: data.lat, lng: data.lng }
      setUserLocation(location)
      await findStationsAndAnalyze(location, distance)
    } catch (err) {
      setError("Failed to search address. Please try again.")
    }
    setLoading(false)
  }

  // Find stations, analyze, and get precise routing
  async function findStationsAndAnalyze(location: any, searchDistance: string) {
    setError("")
    setLoading(true)
    setRouteMetrics(null)
    setAlgorithmResults(null)
    setStations([])
    
    try {
      const stationsResponse = await fetch(
        `/api/stations?lat=${location.lat}&lng=${location.lng}&distance=${searchDistance || 25}`
      )

      if (!stationsResponse.ok) {
        const msg = await stationsResponse.text()
        setError(msg || "Failed to find stations")
        setLoading(false)
        return
      }

      const stationsData = await stationsResponse.json()

      if (stationsData.error) {
        setError(stationsData.error)
        setLoading(false)
        return
      }

      const foundStations = stationsData.stations || []
      setStations(foundStations)

      if (foundStations.length > 0) {
        // Run AI consensus algorithm
        const algorithmResponse = await fetch("/api/find-best-station", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userLocation: location,
            stations: foundStations,
          }),
        })

        if (algorithmResponse.ok) {
          const algorithmData = await algorithmResponse.json()
          setAlgorithmResults(algorithmData)

          // Fetch precise TomTom routing for the chosen optimal station
          if (algorithmData?.bestStation) {
            fetchRoutePath(location, algorithmData.bestStation)
          }
        }
      }
    } catch (err) {
      setError("Failed to analyze stations. Please try again.")
    }
    setLoading(false)
  }

  async function fetchRoutePath(start: any, dest: any) {
      try {
          const routeRes = await fetch(`/api/get-route?startLat=${start.lat}&startLng=${start.lng}&endLat=${dest.lat}&endLng=${dest.lng}`)
          if (routeRes.ok) {
              const routeData = await routeRes.json()
              setRouteMetrics(routeData)
          }
      } catch(err) {
          console.error("Routing error:", err)
      }
  }

  function openDirections(station: any) {
    const url = `https://www.google.com/maps/dir/${userLocation?.lat},${userLocation?.lng}/${station.lat},${station.lng}`
    window.open(url, "_blank")
  }

  function handleKeyPress(e: any) {
    if (e.key === "Enter") {
      searchAddress()
    }
  }

  // Downsample polyline to fit within TomTom Static Map URI limit
  function getDownsampledPath(points: any[] = [], maxPoints = 50) {
      if(!points || points.length === 0) return "";
      let step = Math.ceil(points.length / maxPoints);
      let sample = [];
      for(let i=0; i<points.length; i+=step) {
          sample.push(`${points[i].lng},${points[i].lat}`);
      }
      if (points.length > 0 && (points.length - 1) % step !== 0) {
          let last = points[points.length - 1];
          sample.push(`${last.lng},${last.lat}`);
      }
      return `lw:4|lc:10B981|la:0.8|${sample.join('|')}`;
  }

  // Produce Map Preview URL
  let mapUrl = ""
  if (algorithmResults?.bestStation && userLocation) {
      const pinStart = `sc:1|lc:1f2937|${userLocation.lng},${userLocation.lat}`
      const pinEnd = `sc:1|lc:10B981|${algorithmResults.bestStation.lng},${algorithmResults.bestStation.lat}`
      const pathOverlay = routeMetrics?.points ? `&path=${getDownsampledPath(routeMetrics.points)}` : ""
      
      const staticBase = `https://api.tomtom.com/map/1/staticimage?key=${tomtomKey}&format=png&layer=basic&style=main&width=800&height=400&view=Unified&padding=0.2`
      mapUrl = `${staticBase}&mark=${pinStart}|${pinEnd}${pathOverlay}`
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation Bar - Frosted Glass */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-100/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-[0_2px_10px_rgba(16,185,129,0.2)]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                EV Finder
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="pt-16 bg-blue-50/50 text-blue-700 py-2 border-b border-blue-100/50 text-sm backdrop-blur-sm z-40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span className="font-medium">Demo location data in use (Backend Autocomplete API unreachable)</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-16 flex flex-col items-center">

        {/* Hero Section */}
        <div className={`w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ease-in-out ${algorithmResults ? 'mb-12' : 'mt-20 mb-20'}`}>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tighter mb-4">
            Locate. Navigate. <span className="text-emerald-500">Charge.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto font-medium tracking-tight">
            Advanced routing algorithms identify the optimal EV charging station based on distance and availability metrics.
          </p>

          {/* Command-Center Search Pill */}
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gray-200/50 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>

            <div className={`relative bg-white rounded-full p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex flex-col sm:flex-row items-center overflow-visible transition-all duration-300`}>
              {loading && <div className="absolute top-0 left-0 h-[2px] rounded-t-full bg-emerald-500 w-1/3 animate-[scanning_1.5s_ease-in-out_infinite]"></div>}

              {/* Autocomplete Input Container */}
              <div className="flex-1 flex items-center w-full px-4 py-2 sm:py-0 relative" ref={suggestionsRef}>
                <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                <Input
                  placeholder="Enter location or address..."
                  value={address}
                  onChange={handleAddressChange}
                  onKeyPress={handleKeyPress}
                  className="border-0 shadow-none focus-visible:ring-0 text-lg h-12 w-full p-0 bg-transparent placeholder:text-gray-400 font-medium"
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-[120%] left-0 w-full bg-white rounded-2xl shadow-[0_12px_45px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                    {suggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="px-5 py-3.5 hover:bg-emerald-50 cursor-pointer flex items-center border-b border-gray-50 last:border-0 transition-colors"
                      >
                         <MapPin className="h-4 w-4 text-emerald-500 mr-3 shrink-0" />
                         <span className="text-sm font-medium text-gray-800 text-left">{suggestion.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden sm:block w-[1px] h-8 bg-gray-200 mx-2 shrink-0"></div>

              <div className="flex-1 sm:max-w-[140px] flex items-center w-full px-4 py-2 sm:py-0 border-t sm:border-0 border-gray-100 mt-2 sm:mt-0">
                <Route className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                <Input
                  placeholder="Radius (km)"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="border-0 shadow-none focus-visible:ring-0 text-base h-12 w-full p-0 bg-transparent placeholder:text-gray-400 font-medium"
                />
              </div>

              <div className="w-full sm:w-auto mt-2 sm:mt-0 p-1 flex gap-2">
                <Button
                  onClick={getCurrentLocation}
                  disabled={loading}
                  variant="secondary"
                  className="flex-1 sm:flex-none h-12 rounded-full px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-200 ease-out active:scale-[0.98]"
                  title="Use current location"
                >
                  <Target className="h-5 w-5" />
                </Button>
                <Button
                  onClick={searchAddress}
                  disabled={loading || (!address.trim() && !userLocation)}
                  className="flex-1 sm:flex-none h-12 rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-200 ease-out active:scale-[0.98] shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)]"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Search className="mr-2 h-4 w-4" /> Locate</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {userLocation && !loading && (
            <div className="mt-6 inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700">
              <MapPin className="h-3 w-3 mr-1" />
              Location set: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="w-full max-w-3xl mx-auto px-4 mb-8">
            <div className="p-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-center shadow-sm">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Results - Bento Box Grid */}
        {algorithmResults && !loading && (
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 fade-in">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Main Feature Tile: Best Station with Map */}
              <div className="md:col-span-2 bg-white rounded-3xl pb-0 flex flex-col border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r z-10 from-emerald-400 to-emerald-500"></div>

                <div className="flex flex-col h-full bg-white z-10 p-8 pb-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <Trophy className="h-5 w-5 text-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Optimal Choice</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-3">
                      {algorithmResults.bestStation.name}
                    </h2>

                    <p className="text-gray-500 font-medium flex items-start text-lg mb-6">
                      <MapPin className="mr-2 h-5 w-5 shrink-0 mt-0.5 text-gray-400" />
                      {algorithmResults.bestStation.address}
                    </p>
                </div>
                
                {/* Map Preview Area */}
                <div className="w-full h-[260px] md:h-[320px] bg-gray-50 border-t border-gray-100 relative mt-auto">
                    {mapUrl ? (
                        <img src={mapUrl} alt="Route preview" className="object-cover w-full h-full absolute inset-0" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col text-gray-400 bg-gray-100/50">
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                            <span className="text-sm font-medium">Generating Map Route...</span>
                        </div>
                    )}

                    {/* Enhanced Routing Metrics Overlays overlaying the map */}
                    {routeMetrics && (
                        <div className="absolute bottom-4 left-4 flex gap-2">
                           {/* Distance pill */}
                           <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center">
                              <div className="bg-blue-50 text-blue-500 h-6 w-6 rounded-md flex items-center justify-center mr-2">
                                <Route className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                 {(routeMetrics.distanceMeters / 1000).toFixed(1)} <span className="text-gray-500 font-medium">km</span>
                              </span>
                           </div>
                           
                           {/* Time pill */}
                           <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center">
                              <div className="bg-emerald-50 text-emerald-500 h-6 w-6 rounded-md flex items-center justify-center mr-2">
                                <Clock className="h-3.5 w-3.5" />
                              </div>
                              <span className="text-sm font-bold text-gray-900">
                                 {Math.ceil(routeMetrics.travelTimeSeconds / 60)} <span className="text-gray-500 font-medium">min drive</span>
                              </span>
                           </div>
                        </div>
                    )}
                    
                    {/* Navigation action integrated into map corner */}
                    <div className="absolute top-4 right-4">
                        <Button
                          onClick={() => openDirections(algorithmResults.bestStation)}
                          className="h-12 px-6 rounded-full bg-gray-900 hover:bg-gray-800 shadow-xl text-white font-semibold transition-all duration-200"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Start Navigation
                        </Button>
                    </div>
                </div>
              </div>

              {/* Side Tiles Container */}
              <div className="flex flex-col gap-6">

                {/* Metric Tile 1: Consensus */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center relative overflow-hidden flex-1">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <Cpu className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="text-5xl font-extrabold text-gray-900 tracking-tighter mb-1">
                    {algorithmResults.explanation.consensus.split(' ')[0]}<span className="text-2xl text-gray-300">/{algorithmResults.explanation.details.length}</span>
                  </div>
                  <p className="text-sm font-bold tracking-tight text-gray-400 uppercase">Algorithms Agree</p>
                </div>

                {/* Metric Tile 2: Total Found */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center items-center text-center flex-1">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900 tracking-tighter mb-1">
                    {stations.length}
                  </div>
                  <p className="text-sm font-bold tracking-tight text-gray-400 uppercase">Nearby Stations</p>
                </div>

              </div>
            </div>

            {/* Algorithm Details Grid */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-6">Algorithm Routing Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {algorithmResults.explanation.details.map((result: any, index: number) => {
                  const isWinner = result.choice === algorithmResults.bestStation.name;
                  return (
                    <div key={index} className={`bg-white rounded-2xl p-5 border ${isWinner ? 'border-emerald-200' : 'border-gray-100'} shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-gray-900 text-sm">{result.algorithm}</span>
                        <div className={`text-xs font-bold px-2 py-1 rounded-md ${isWinner ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500'}`}>
                          {result.score} pts
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Selected</p>
                        <p className={`font-semibold text-sm leading-tight mb-3 ${isWinner ? 'text-emerald-600' : 'text-gray-700'}`}>
                          {result.choice}
                        </p>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          {result.reasoning}
                        </p>
                      </div>

                      {isWinner && (
                        <div className="mt-4 pt-4 border-t border-emerald-50/50 flex items-center text-xs font-bold text-emerald-500">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Consensus Match
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alternative Stations List */}
            {stations.length > 1 && (
              <div className="mt-16 pt-8 border-t border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-6 flex items-center">
                  Alternative Charging Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {stations.filter((s:any) => s.name !== algorithmResults.bestStation.name).map((station, index) => (
                    <div key={station.id || index} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-gray-900 leading-tight">{station.name}</h4>
                      </div>
                      <div className="space-y-2 mb-5">
                        <p className="text-sm text-gray-500 flex items-start font-medium">
                          <MapPin className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
                          <span className="line-clamp-2">{station.address}</span>
                        </p>
                        <p className="text-sm text-gray-900 flex items-center font-semibold">
                          <Route className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
                          {station.distance}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => openDirections(station)}
                        className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold h-10 rounded-xl"
                      >
                        Directions <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 bg-white/50 backdrop-blur-sm py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-gray-300" />
            <span className="text-gray-900 font-bold tracking-tight">EV Finder</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

