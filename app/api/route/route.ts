import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the incoming request body
    const data = await request.json();
    const {
      locations,
      vehicleEngineType,
      vehicleWeight,
      currentChargeInkWh,
      maxChargeInkWh,
      minChargeAtDestinationInkWh,
    } = data;

    // Log the incoming data for debugging
    console.log('Request Data:', data);

    // Make sure to have the proper environment variable set for your TomTom API key
    const apiKey = process.env.TOMTOM_API_KEY;
    if (!apiKey) {
      console.error('API key missing');
      return NextResponse.json({ error: 'API key missing' }, { status: 400 });
    }

    const origin = locations[0];  // start location
    const destination = locations[1];  // finish location

    // Log the origin and destination for debugging
    console.log('Origin:', origin, 'Destination:', destination);

    // TomTom route API URL
    const tomTomUrl = `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?key=${apiKey}&vehicleEngineType=${vehicleEngineType}&vehicleWeight=${vehicleWeight}&currentChargeInkWh=${currentChargeInkWh}&maxChargeInkWh=${maxChargeInkWh}&minChargeAtDestinationInkWh=${minChargeAtDestinationInkWh}`;

    // Log the TomTom API URL for debugging
    console.log('TomTom API URL:', tomTomUrl);

    // Fetch route data from the TomTom API
    const routeRes = await fetch(tomTomUrl);

    // Check if the TomTom API request was successful
    if (!routeRes.ok) {
      console.error('Error fetching route data from TomTom API');
      return NextResponse.json({ error: "Failed to fetch route data from TomTom." }, { status: 500 });
    }

    // Parse the route data response
    const routeData = await routeRes.json();

    // Log the response data from TomTom API
    console.log('Route Data from TomTom:', routeData);

    // Check if the route data is empty
    if (!routeData.routes || routeData.routes.length === 0) {
      console.warn('No suitable route found');
      return NextResponse.json({ error: "No suitable route found." }, { status: 404 });
    }

    // Return the first route
    return NextResponse.json(routeData.routes[0]);

  } catch (error) {
    console.error("Error calculating route:", error);
    return NextResponse.json({ error: "Unknown error calculating route." }, { status: 500 });
  }
}
