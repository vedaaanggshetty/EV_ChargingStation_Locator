import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const center = searchParams.get("center") // format: lat,lng
  const radius = searchParams.get("radius")
  const limit = searchParams.get("limit") || "100"

  if (!center || !radius) {
    return new Response("Missing center or radius", { status: 400 })
  }

  const [lat, lon] = center.split(",")
  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY

  const url = `https://api.tomtom.com/search/2/categorySearch/electric%20vehicle%20station.json?key=${apiKey}&lat=${lat}&lon=${lon}&radius=${radius}&limit=${limit}&categorySet=7309`

  const res = await fetch(url)
  if (!res.ok) return new Response("TomTom error", { status: res.status })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  })
}
