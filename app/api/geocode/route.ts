import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address || address.trim().length === 0) {
      return NextResponse.json({ error: "Please enter an address" }, { status: 400 })
    }

    const apiKey = process.env.TOMTOM_API_KEY || "ZlqKBSOjQlEAKDylTtzkSgdKUfOIHY8F"
    if (!apiKey) {
      console.warn("⚠️ TomTom API key not found, using mock geocoding data")

      // Return mock coordinates for demo purposes
      const mockCoordinates = getMockCoordinates(address.trim())

      return NextResponse.json({
        lat: mockCoordinates.lat,
        lng: mockCoordinates.lng,
        address: `${address.trim()} (Demo Location)`,
      })
    }

    const cleanAddress = address.trim()
    console.log("🔍 Geocoding:", cleanAddress)

    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(cleanAddress)}.json?key=${apiKey}&limit=1`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("❌ TomTom geocoding failed:", response.status)
      return NextResponse.json({ error: "Address search failed" }, { status: 500 })
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: `Address "${cleanAddress}" not found. Try a city name like "New York" or "Los Angeles"` },
        { status: 404 },
      )
    }

    const result = data.results[0]
    console.log("✅ Geocoded successfully:", result.position)

    return NextResponse.json({
      lat: result.position.lat,
      lng: result.position.lon,
      address: result.address.freeformAddress,
    })
  } catch (error) {
    console.error("💥 Geocoding error:", error)
    return NextResponse.json({ error: "Failed to search address" }, { status: 500 })
  }
}

// Mock geocoding function for demo purposes
function getMockCoordinates(address: string) {
  const addressLower = address.toLowerCase()

  // Common city coordinates for demo
  const mockLocations = {
    "san francisco": { lat: 37.7749, lng: -122.4194 },
    "new york": { lat: 40.7128, lng: -74.006 },
    "los angeles": { lat: 34.0522, lng: -118.2437 },
    chicago: { lat: 41.8781, lng: -87.6298 },
    seattle: { lat: 47.6062, lng: -122.3321 },
    austin: { lat: 30.2672, lng: -97.7431 },
    denver: { lat: 39.7392, lng: -104.9903 },
    miami: { lat: 25.7617, lng: -80.1918 },
    boston: { lat: 42.3601, lng: -71.0589 },
    portland: { lat: 45.5152, lng: -122.6784 },
  }

  // Check if address contains any known city
  for (const [city, coords] of Object.entries(mockLocations)) {
    if (addressLower.includes(city)) {
      return coords
    }
  }

  // Default to San Francisco if no match
  return { lat: 37.7749, lng: -122.4194 }
}
