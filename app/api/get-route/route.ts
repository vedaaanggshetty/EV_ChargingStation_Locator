import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get('startLat');
  const startLng = searchParams.get('startLng');
  const endLat = searchParams.get('endLat');
  const endLng = searchParams.get('endLng');

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const apiKey = process.env.TOMTOM_API_KEY || process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing TomTom API Key" }, { status: 500 });
  }

  try {
    // TomTom Routing API calculateRoute
    const routingUrl = `https://api.tomtom.com/routing/1/calculateRoute/${startLat},${startLng}:${endLat},${endLng}/json?key=${apiKey}&routeRepresentation=polyline`;
    const response = await fetch(routingUrl);
    
    if (!response.ok) {
        throw new Error("Failed to fetch route summary from TomTom")
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const summary = data.routes[0].summary;
      const legs = data.routes[0].legs[0];
      
      // Parse coordinates for mapping
      const points = legs.points.map((p: any) => ({
          lat: p.latitude,
          lng: p.longitude
      }));

      return NextResponse.json({
        distanceMeters: summary.lengthInMeters,
        travelTimeSeconds: summary.travelTimeInSeconds,
        points: points,
      });
    }

    return NextResponse.json({ error: "No route found" }, { status: 404 });
  } catch (err: any) {
    console.error("Routing error:", err);
    return NextResponse.json({ error: 'Failed to calculate route' }, { status: 500 });
  }
}
