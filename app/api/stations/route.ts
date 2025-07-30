import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const distance = searchParams.get("distance") || "25" // Default to 25 km if not provided

    if (!lat || !lng) {
      return NextResponse.json({ error: "Coordinates required" }, { status: 400 })
    }

    const apiKey = process.env.TOMTOM_API_KEY || "ZlqKBSOjQlEAKDylTtzkSgdKUfOIHY8F"
    if (!apiKey) {
      console.warn("⚠️ TomTom API key not found, using mock station data")

      // Return mock stations for demo purposes
      const mockStations = generateMockStations(Number.parseFloat(lat), Number.parseFloat(lng))

      return NextResponse.json({ stations: mockStations })
    }

    console.log("🔍 Searching stations near:", lat, lng)

    // Search for EV charging stations
    const url = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${apiKey}&lat=${lat}&lon=${lng}&radius=${distance}000&categorySet=7309&limit=10`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("❌ Stations search failed:", response.status)
      return NextResponse.json({ error: "Failed to find charging stations" }, { status: 500 })
    }

    const data = await response.json()
    console.log("📊 Found", data.results?.length || 0, "stations")

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ error: "No charging stations found in this area" }, { status: 404 })
    }

    // Process and enhance station data
    const stations = data.results.map((result: any, index: number) => {
      const distance = calculateDistance(
        Number.parseFloat(lat),
        Number.parseFloat(lng),
        result.position.lat,
        result.position.lon,
      )

      return {
        id: `station_${index}`,
        name: result.poi?.name || "EV Charging Station",
        address: result.address?.freeformAddress || "Address not available",
        lat: result.position.lat,
        lng: result.position.lon,
        distance: `${distance.toFixed(1)} km`,
        distanceKm: distance,
        phone: result.poi?.phone || null,
      }
    })

    // Sort by distance (closest first)
    stations.sort((a, b) => a.distanceKm - b.distanceKm)

    console.log("✅ Returning", stations.length, "processed stations")
    return NextResponse.json({ stations })
  } catch (error) {
    console.error("💥 Stations search error:", error)
    return NextResponse.json({ error: "Failed to find charging stations" }, { status: 500 })
  }
}

// Generate mock stations for demo purposes
function generateMockStations(lat: number, lng: number) {
  const mockStations = [
    {
      id: "station_0",
      name: "Tesla Supercharger",
      address: "123 Main St, Downtown",
      lat: lat + 0.01,
      lng: lng + 0.01,
      distance: "1.2 km",
      distanceKm: 1.2,
      phone: null,
    },
    {
      id: "station_1",
      name: "ChargePoint Station",
      address: "456 Oak Ave, City Center",
      lat: lat + 0.02,
      lng: lng - 0.01,
      distance: "2.1 km",
      distanceKm: 2.1,
      phone: null,
    },
    {
      id: "station_2",
      name: "Electrify America",
      address: "789 Pine St, Shopping Mall",
      lat: lat - 0.01,
      lng: lng + 0.02,
      distance: "2.8 km",
      distanceKm: 2.8,
      phone: null,
    },
    {
      id: "station_3",
      name: "EVgo Fast Charging",
      address: "321 Elm Dr, Business District",
      lat: lat + 0.03,
      lng: lng + 0.03,
      distance: "3.5 km",
      distanceKm: 3.5,
      phone: null,
    },
    {
      id: "station_4",
      name: "Blink Charging Station",
      address: "654 Maple Rd, Residential Area",
      lat: lat - 0.02,
      lng: lng - 0.02,
      distance: "4.1 km",
      distanceKm: 4.1,
      phone: null,
    },
    {
      id: "station_5",
      name: "Shell Recharge",
      address: "987 Cedar Blvd, Highway Exit",
      lat: lat + 0.04,
      lng: lng - 0.03,
      distance: "5.2 km",
      distanceKm: 5.2,
      phone: null,
    },
  ]

  // Sort by distance
  return mockStations.sort((a, b) => a.distanceKm - b.distanceKm)
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
