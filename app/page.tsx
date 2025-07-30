"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Zap,
  BarChart3,
  ArrowRight,
  Navigation,
  Battery,
  Info,
  Search,
  Target,
  Sparkles,
  TrendingUp,
  Shield,
  Wifi,
} from "lucide-react"

export default function EVChargingApp() {
  const [userLocation, setUserLocation] = useState(null)
  const [stations, setStations] = useState([])
  const [algorithmResults, setAlgorithmResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [address, setAddress] = useState("")
  const [distance, setDistance] = useState("")
  const [demoMode, setDemoMode] = useState(false)

  // Get user's current location
  async function getCurrentLocation() {
    setLoading(true)
    setError("")

    try {
      const position = await new Promise((resolve, reject) => {
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
      await findStationsAndAnalyze(location, distance)
    } catch (err) {
      setError("Could not get your location. Please enter an address manually.")
    }
    setLoading(false)
  }

  // Search for address
  async function searchAddress() {
    if (!address.trim()) {
      setError("Please enter an address")
      return
    }

    setLoading(true)
    setError("")
    setDemoMode(false)

    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      // Check if we're in demo mode
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

  // Find stations and run algorithm analysis
  async function findStationsAndAnalyze(location, distance) {
    setError("")
    try {
      console.log("🔍 Finding stations and running algorithms...")

      // Step 1: Find nearby charging stations
      const stationsResponse = await fetch(
        `/api/stations?lat=${location.lat}&lng=${location.lng}&distance=${distance || 25}`,
      )

      if (!stationsResponse.ok) {
        const msg = await stationsResponse.text()
        setError(msg || "Failed to find stations")
        return
      }

      const stationsData = await stationsResponse.json()

      if (stationsData.error) {
        setError(stationsData.error)
        return
      }

      const foundStations = stationsData.stations || []
      setStations(foundStations)

      // Step 2: Run multiple algorithms to find best station
      if (foundStations.length > 0) {
        console.log("🤖 Running multiple algorithms...")

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
          console.log("✅ Algorithm analysis complete!")
        }
      }
    } catch (err) {
      console.error("Analysis error:", err)
      setError("Failed to analyze stations. Please try again.")
    }
  }

  // Open Google Maps for directions
  function openDirections(station) {
    const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${station.lat},${station.lng}`
    window.open(url, "_blank")
  }

  // Handle Enter key press
  function handleKeyPress(e) {
    if (e.key === "Enter") {
      searchAddress()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-teal-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center animate-pulse-glow">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold heading-responsive bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                EV Finder Pro
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                Features
              </a>
              {/* <a href="#how-it-works" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                How it Works
              </a> */}
              <a href="#about" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">
                About
              </a>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 button-hover-effect"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <Info className="mr-2 h-5 w-5 animate-bounce" />
            <span className="font-medium">Demo Mode: Using sample data for demonstration purposes</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 animate-gradient">
        <div className="absolute inset-0 bg-black/10"></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><g fill="#ffffff" fillOpacity="0.05"><circle cx="30" cy="30" r="2"/></g></g></svg>')}")`,
          }}
        ></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center text-white">
            <div className="flex justify-center mb-8">
              <div className="p-6 bg-white/20 rounded-3xl backdrop-blur-sm animate-float">
                <Zap className="h-16 w-16 text-white" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 heading-responsive animate-slide-up">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">
                Powering Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">
                EV Journey
              </span>
            </h1>

            <p className="text-xl lg:text-2xl mb-10 text-emerald-100 max-w-3xl mx-auto text-responsive leading-relaxed animate-slide-up">
              Discover optimal charging stations using advanced AI algorithms.
              <span className="block mt-2 font-semibold">Anywhere, anytime, intelligently.</span>
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 animate-slide-up">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold px-8 py-4 text-lg button-hover-effect micro-bounce rounded-2xl shadow-2xl"
              >
                <Target className="mr-3 h-6 w-6" />
                Find Chargers Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg bg-transparent button-hover-effect micro-bounce rounded-2xl backdrop-blur-sm"
              >
                <Sparkles className="mr-3 h-6 w-6" />
                See How It Works
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24" id="features">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 heading-responsive">
            Smart Charging Solutions
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg lg:text-xl text-responsive leading-relaxed">
            Advanced algorithms analyze multiple factors to find your perfect charging station with unprecedented
            accuracy
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-20">
          <Card className="border-0 shadow-xl hover:shadow-2xl card-hover-effect bg-gradient-to-br from-emerald-50 to-teal-50 group">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Battery className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg heading-responsive">Smart Analytics</h3>
              <p className="text-gray-600 text-responsive leading-relaxed">
                AI-powered station selection based on multiple optimization factors including distance, speed, and
                availability
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl card-hover-effect bg-gradient-to-br from-blue-50 to-cyan-50 group">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wifi className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg heading-responsive">Real-time Data</h3>
              <p className="text-gray-600 text-responsive leading-relaxed">
                Live availability and charging speed information updated in real-time for accurate planning
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl card-hover-effect bg-gradient-to-br from-teal-50 to-emerald-50 group">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg heading-responsive">Multi-Algorithm</h3>
              <p className="text-gray-600 text-responsive leading-relaxed">
                Dijkstra, A*, Genetic, and ML algorithms working together for optimal results
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl card-hover-effect bg-gradient-to-br from-cyan-50 to-blue-50 group">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-4 text-lg heading-responsive">Route Optimization</h3>
              <p className="text-gray-600 text-responsive leading-relaxed">
                Integrated navigation with optimal charging stops for efficient journey planning
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Location Input Section */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-12 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white p-8 lg:p-10 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
            <CardTitle className="flex items-center text-2xl lg:text-3xl heading-responsive relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm">
                <MapPin className="h-7 w-7" />
              </div>
              Find Your Optimal Charging Station
            </CardTitle>
            <p className="text-emerald-100 text-lg lg:text-xl text-responsive mt-4 leading-relaxed relative z-10">
              Enter your location to discover the best charging options using our advanced AI algorithms
            </p>
          </CardHeader>

          <CardContent className="p-8 lg:p-10">
            <div className="space-y-8">
              <Button
                onClick={getCurrentLocation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 lg:py-5 text-lg lg:text-xl button-hover-effect micro-bounce rounded-2xl shadow-lg"
              >
                <Target className="mr-3 h-6 w-6" />
                {loading ? (
                  <span className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Getting Location<span className="loading-dots"></span>
                  </span>
                ) : (
                  "Use Current Location"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t-2 border-gray-200" />
                </div>
                <div className="relative flex justify-center text-base">
                  <span className="px-6 bg-white text-gray-500 font-medium">or enter manually</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
                <div className="lg:col-span-3 relative group">
                  <label className="absolute -top-2 left-4 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-300 group-focus-within:text-emerald-600 group-focus-within:scale-105">
                    Address or Location
                  </label>
                  <Input
                    placeholder="Enter address (e.g., San Francisco, CA)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-14 text-lg border-2 border-gray-200 focus:border-emerald-500 rounded-xl input-focus-effect focus-ring pt-2"
                  />
                </div>

                <div className="relative group">
                  <label className="absolute -top-2 left-4 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-300 group-focus-within:text-emerald-600 group-focus-within:scale-105">
                    Distance (km)
                  </label>
                  <Input
                    placeholder="25"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-14 text-lg border-2 border-gray-200 focus:border-emerald-500 rounded-xl input-focus-effect focus-ring pt-2"
                  />
                </div>

                <Button
                  onClick={searchAddress}
                  disabled={loading || !address.trim()}
                  className="h-14 px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-bold text-lg button-hover-effect micro-bounce rounded-xl shadow-lg"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>

              {userLocation && (
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 animate-slide-up">
                  <div className="flex items-center text-emerald-800">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-4">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-lg">Location Confirmed</span>
                      <p className="text-emerald-700">
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                        {demoMode && <span className="ml-2 text-blue-600 font-semibold">(Demo Mode)</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-2 border-red-300 bg-gradient-to-r from-red-50 to-pink-50 animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex items-center p-6 text-red-700 bg-red-100 rounded-2xl border border-red-200">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Error</h3>
                  <p className="text-responsive">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card className="mb-8 border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50 animate-slide-up">
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse-glow">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 heading-responsive">
                  Analyzing Charging Stations
                </h3>
                <p className="text-gray-600 text-lg text-responsive max-w-md mx-auto">
                  Running advanced algorithms to find your optimal charging solution
                  <span className="loading-dots"></span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Algorithm Results */}
        {algorithmResults && (
          <div className="space-y-8 mb-12">
            {/* Best Station Winner */}
            <Card className="border-4 border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 shadow-2xl animate-slide-up overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white p-8 lg:p-10 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <CardTitle className="flex items-center text-2xl lg:text-3xl heading-responsive relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center mr-4 animate-pulse-glow">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <span className="block">Optimal Charging Station</span>
                    <span className="text-lg text-emerald-100 font-normal">AI Recommended</span>
                  </div>
                  {demoMode && <Badge className="ml-4 bg-blue-500 text-white px-4 py-2 text-sm">DEMO</Badge>}
                </CardTitle>
                <p className="text-emerald-100 text-lg lg:text-xl text-responsive mt-4 relative z-10">
                  <strong>{algorithmResults.explanation.consensus}</strong> algorithms recommend this station
                </p>
              </CardHeader>

              <CardContent className="p-8 lg:p-10">
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg">
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 heading-responsive">
                      {algorithmResults.bestStation.name}
                    </h3>
                    <p className="text-gray-600 flex items-center text-lg text-responsive mb-6">
                      <MapPin className="mr-3 h-6 w-6 text-emerald-500" />
                      {algorithmResults.bestStation.address}
                    </p>
                    <div className="flex items-center text-emerald-600 font-bold text-lg mb-6">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Consensus Choice - Highest Algorithm Agreement
                    </div>
                  </div>

                  <Button
                    onClick={() => openDirections(algorithmResults.bestStation)}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 hover:from-emerald-600 hover:via-teal-600 hover:to-blue-600 text-white font-bold py-4 lg:py-5 text-lg lg:text-xl button-hover-effect micro-bounce rounded-2xl shadow-xl"
                  >
                    <Navigation className="mr-3 h-6 w-6" />
                    Get Directions to Optimal Station
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Algorithm Comparison */}
            <Card className="shadow-2xl bg-white/95 backdrop-blur-sm animate-slide-up overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-700 via-gray-700 to-slate-800 text-white p-8 lg:p-10 relative">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mt-20"></div>
                <CardTitle className="flex items-center text-2xl lg:text-3xl heading-responsive relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <span className="block">Advanced Algorithm Analysis</span>
                    <span className="text-lg text-gray-300 font-normal">Multi-AI Comparison</span>
                  </div>
                  {demoMode && (
                    <Badge className="ml-4 bg-white text-blue-600 px-4 py-2 text-sm font-bold">DEMO DATA</Badge>
                  )}
                </CardTitle>
                <p className="text-gray-300 text-lg lg:text-xl text-responsive mt-4 relative z-10">
                  Multiple AI algorithms analyzed your options for the best recommendation
                </p>
              </CardHeader>

              <CardContent className="p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {algorithmResults.explanation.details.map((result, index) => (
                    <div
                      key={index}
                      className={`p-6 lg:p-8 border-3 rounded-2xl card-hover-effect transition-all duration-500 ${
                        result.choice === algorithmResults.bestStation.name
                          ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-xl animate-pulse-glow"
                          : "border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="font-bold text-gray-900 text-lg lg:text-xl heading-responsive">
                          {result.algorithm}
                        </h4>
                        <div
                          className={`score-badge px-4 py-2 rounded-full font-bold text-sm ${
                            result.choice === algorithmResults.bestStation.name
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          Score: {result.score}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className="font-bold text-gray-800 text-lg">
                          Selected: <span className="text-emerald-600">{result.choice}</span>
                        </p>
                        <p className="text-gray-600 text-responsive leading-relaxed">{result.reasoning}</p>

                        {result.choice === algorithmResults.bestStation.name && (
                          <div className="flex items-center text-emerald-600 font-bold text-lg bg-emerald-100 rounded-xl p-4 mt-4">
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-bold">✓</span>
                            </div>
                            Consensus Choice
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* All Stations List */}
        {stations.length > 0 && (
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm animate-slide-up overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 via-slate-700 to-gray-900 text-white p-8 lg:p-10 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              <CardTitle className="flex items-center text-2xl lg:text-3xl heading-responsive relative z-10">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <span className="block">All Nearby Charging Stations</span>
                  <span className="text-lg text-gray-300 font-normal">({stations.length} found)</span>
                </div>
                {demoMode && <Badge className="ml-4 bg-blue-500 text-white px-4 py-2 text-sm">DEMO DATA</Badge>}
              </CardTitle>
              <p className="text-gray-300 text-lg lg:text-xl text-responsive mt-4 relative z-10">
                Complete list of available charging options in your area
              </p>
            </CardHeader>

            <CardContent className="p-8 lg:p-10">
              <div className="space-y-6">
                {stations.map((station, index) => (
                  <div
                    key={station.id || index}
                    className={`p-6 lg:p-8 border-3 rounded-2xl card-hover-effect transition-all duration-500 ${
                      algorithmResults && algorithmResults.bestStation.name === station.name
                        ? "border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 shadow-xl animate-pulse-glow"
                        : "border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-gray-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start mb-6 space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center mb-4 space-y-2 sm:space-y-0">
                          <h3 className="text-xl lg:text-2xl font-bold text-gray-900 heading-responsive">
                            {station.name}
                          </h3>
                          {algorithmResults && algorithmResults.bestStation.name === station.name && (
                            <Badge className="sm:ml-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-4 py-2 text-sm animate-pulse-glow">
                              🏆 AI RECOMMENDED
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-3">
                          <p className="text-gray-600 flex items-center text-lg text-responsive">
                            <MapPin className="mr-3 h-5 w-5 text-gray-400" />
                            {station.address}
                          </p>
                          <p className="text-gray-500 flex items-center text-lg text-responsive">
                            <Navigation className="mr-3 h-5 w-5 text-gray-400" />
                            <span className="font-semibold text-emerald-600">{station.distance}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => openDirections(station)}
                      className={`w-full font-bold py-4 text-lg button-hover-effect micro-bounce rounded-xl shadow-lg ${
                        algorithmResults && algorithmResults.bestStation.name === station.name
                          ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 hover:from-emerald-600 hover:via-teal-600 hover:to-blue-600"
                          : "bg-gradient-to-r from-gray-600 to-slate-700 hover:from-gray-700 hover:to-slate-800"
                      }`}
                    >
                      <Navigation className="mr-3 h-5 w-5" />
                      Get Directions
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        {/* <div className="mt-24 py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-3xl text-white shadow-2xl animate-gradient relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><g fill="#ffffff" fillOpacity="0.1"><circle cx="30" cy="30" r="2"/></g></g></svg>')}")`,
            }}
          ></div>

          <div className="relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 heading-responsive">
                Trusted by EV Drivers Worldwide
              </h2>
              <p className="text-emerald-100 max-w-3xl mx-auto text-lg lg:text-xl text-responsive leading-relaxed">
                Join millions of users who rely on our intelligent charging station finder for their daily journeys
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center">
              <div className="group">
                <div className="text-4xl lg:text-5xl font-bold mb-3 heading-responsive group-hover:scale-110 transition-transform duration-300">
                  5M+
                </div>
                <div className="text-emerald-100 text-lg text-responsive">Active Users</div>
              </div>
              <div className="group">
                <div className="text-4xl lg:text-5xl font-bold mb-3 heading-responsive group-hover:scale-110 transition-transform duration-300">
                  50K+
                </div>
                <div className="text-emerald-100 text-lg text-responsive">Charging Stations</div>
              </div>
              <div className="group">
                <div className="text-4xl lg:text-5xl font-bold mb-3 heading-responsive group-hover:scale-110 transition-transform duration-300">
                  99.9%
                </div>
                <div className="text-emerald-100 text-lg text-responsive">Uptime</div>
              </div>
              <div className="group">
                <div className="text-4xl lg:text-5xl font-bold mb-3 heading-responsive group-hover:scale-110 transition-transform duration-300">
                  4.8★
                </div>
                <div className="text-emerald-100 text-lg text-responsive">User Rating</div>
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Footer */}
      <footer id="about" className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="lg:col-span-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4 animate-pulse-glow">
                  <Zap className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-bold heading-responsive">EV Finder Pro</span>
              </div>
              <p className="text-gray-400 mb-6 text-responsive leading-relaxed">
                Advanced AI-powered charging station discovery platform for electric vehicle owners worldwide.
              </p>
              <div className="flex space-x-4">
                {["f", "t", "in", "ig"].map((social, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-all duration-300 hover:scale-110"
                  >
                    <span className="text-lg font-bold">{social}</span>
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "API", "Mobile App"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Support",
                links: ["Help Center", "Privacy Policy", "Terms of Service", "Status"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-bold mb-6 text-lg heading-responsive">{section.title}</h3>
                <ul className="space-y-3 text-gray-400">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="hover:text-white transition-colors duration-300 text-responsive">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p className="text-responsive">
              &copy; 2025 EV Finder Pro
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
