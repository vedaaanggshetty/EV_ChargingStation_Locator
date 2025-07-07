import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query")

  if (!query) {
    return new Response("Missing query", { status: 400 })
  }

  const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${apiKey}`

  const res = await fetch(url)
  if (!res.ok) return new Response("TomTom error", { status: res.status })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  })
}
