import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.TOMTOM_API_KEY || process.env.NEXT_PUBLIC_TOMTOM_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing TomTom API Key" }, { status: 500 });
  }

  try {
    // TomTom Fuzzy Search API for autocomplete/typeahead
    const response = await fetch(
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(
        query
      )}.json?key=${apiKey}&typeahead=true&limit=5&language=en-US`
    );
    
    if (!response.ok) {
        throw new Error("Failed to fetch from TomTom")
    }
    
    const data = await response.json();

    if (data.results) {
      const suggestions = data.results.map((r: any) => {
          // Format a nice display name
          const title = r.poi ? r.poi.name : r.address.freeformAddress;
          const subtitle = r.poi ? r.address.freeformAddress : (r.address.countrySecondarySubdivision || r.address.country);

          return {
            id: r.id,
            text: title + (title !== subtitle && subtitle ? `, ${subtitle}` : ''),
            lat: r.position.lat,
            lng: r.position.lon,
          }
      });
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ suggestions: [] });
  } catch (err: any) {
    console.error("Suggestions error:", err);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
