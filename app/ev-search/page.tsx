"use client";

import { useTomTomMap } from "@/hooks/use-tomtom-map";
import { useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

interface LocationResult {
  position: { lat: number; lon: number }; // TomTom API returns lon, not lng
  address: {
    freeformAddress: string;
  };
  dataSources: {
    chargingAvailability: {
      id: string;
    };
  };
  distance?: number;
}

interface Connector {
  type: string;
  availability: {
    current: {
      available?: number;
      occupied?: number;
      outOfService?: number;
      reserved?: number;
      unknown?: number;
    };
  };
}

interface ChargingAvailabilityResponse {
  connectors: Connector[];
}

const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY ?? "";
if (!TOMTOM_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_TOMTOM_API_KEY");
}

export default function EvSearchPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useTomTomMap(mapContainerRef, TOMTOM_API_KEY, {
    center: [52.37187, 4.89218],
    zoom: 13,
  });

  const [locationQuery, setLocationQuery] = useState("");
  const [distance, setDistance] = useState(50);
  const [markers, setMarkers] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const metersPerKilometer = 1000;
  const markerColor = "blue";
  const mapPadding = 40;
  const limit = 100;

  const properties = [
    { name: "available", label: "available" },
    { name: "occupied", label: "occupied" },
    { name: "outOfService", label: "out of service" },
    { name: "reserved", label: "reserved" },
    { name: "unknown", label: "unknown" },
  ];

  // Utility to convert position { lat, lon } to TomTom format { lng, lat }
  const toLngLat = (pos: { lat: number; lon: number }) => ({
    lng: pos.lon,
    lat: pos.lat,
  });

  const formatText = (
    location: LocationResult,
    response: ChargingAvailabilityResponse | null
  ) => {
    const div = document.createElement("div");
    const a = document.createElement("a");
    const link = document.createTextNode(location.address.freeformAddress);
    a.href = `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lon}`;
    a.appendChild(link);
    div.appendChild(a);

    const appendLine = (parent: HTMLElement, tag: string, text: string) => {
      if (
        parent.childElementCount > 0 &&
        parent.lastChild instanceof Element &&
        parent.lastChild.tagName !== "H3"
      ) {
        parent.appendChild(document.createElement("br"));
      }
      const child = document.createElement(tag);
      child.textContent = text;
      parent.appendChild(child);
    };

    appendLine(div, "h3", "Charging Station");
    appendLine(div, "span", `Address: ${location.address.freeformAddress}`);
    if (location.distance !== undefined)
      appendLine(
        div,
        "span",
        `Distance: ${(location.distance / metersPerKilometer).toFixed(2)} km`
      );

    if (response === null || response.connectors.length === 0) {
      appendLine(div, "span", "Ports available: J1772 (default/unknown)");
      return div.innerHTML;
    }

    response.connectors.forEach((connector) => {
      const current = connector.availability.current;
      let text = `${connector.type}: `;
      let firstCount = true;

      properties.forEach((property) => {
        const count = (current as any)[property.name];
        if (count !== undefined && count > 0) {
          if (firstCount) firstCount = false;
          else text += ", ";
          text += `${count} ${property.label}`;
        }
      });

      if (firstCount) text += "no information";
      appendLine(div, "span", text);
    });

    return div.innerHTML;
  };

  const addMarker = (location: LocationResult) => {
    if (!map || !window.tt) return;

    const lat = location.position.lat;
    const lon = location.position.lon;

    if (typeof lat !== "number" || typeof lon !== "number") {
      console.warn("⚠️ Skipping marker due to invalid coordinates:", location.position);
      return;
    }

    const popup = new window.tt.Popup({ offset: 10, maxWidth: "none" })
      .setHTML(formatText(location, null))
      .on("open", async () => {
        try {
          const response = await fetch(
            `/api/stations/availability?id=${location.dataSources.chargingAvailability.id}`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data: ChargingAvailabilityResponse = await response.json();
          popup.setHTML(formatText(location, data));
        } catch (error) {
          console.error("Error fetching charging availability:", error);
          popup.setHTML(formatText(location, null));
        }
      });

    // Pass position as object { lng, lat } to satisfy TomTom API requirement
    const lngLat = toLngLat(location.position);

    const marker = new window.tt.Marker({ color: markerColor })
      .setLngLat(lngLat)
      .setPopup(popup)
      .addTo(map);

    setMarkers((prev) => [...prev, marker]);
  };

  const clearMarkers = () => {
    markers.forEach((marker) => marker.remove());
    setMarkers([]);
  };

  const findStations = async () => {
    if (!map) {
      setMessage("Map is still loading. Please try again.");
      return;
    }

    clearMarkers();
    setMessage("Finding location...");

    try {
      const fuzzySearchRes = await fetch(
        `/api/stations/fuzzy-search?query=${encodeURIComponent(locationQuery)}`
      );
      if (!fuzzySearchRes.ok)
        throw new Error(`HTTP error! status: ${fuzzySearchRes.status}`);
      const fuzzySearchData = await fuzzySearchRes.json();

      if (!fuzzySearchData.results || fuzzySearchData.results.length === 0) {
        setMessage(`Could not find location for "${locationQuery}".`);
        return;
      }

      const location = fuzzySearchData.results[0];

      // Convert to { lat, lng } with correct lng key from lon
      const center = {
        lat: location.position.lat,
        lng: location.position.lon,
      };
      const radiusInMeters = distance * metersPerKilometer;

      setMessage("Searching for charging stations...");

      const categorySearchRes = await fetch(
        `/api/stations/category-search?center=${center.lat},${center.lng}&radius=${radiusInMeters}&limit=${limit}`
      );
      if (!categorySearchRes.ok)
        throw new Error(`HTTP error! status: ${categorySearchRes.status}`);
      const categorySearchData = await categorySearchRes.json();

      if (!categorySearchData.results || categorySearchData.results.length === 0) {
        setMessage("No charging stations were found.");
        return;
      }

      const bounds = new window.tt.LngLatBounds();
      categorySearchData.results.forEach((loc: LocationResult) => {
        addMarker(loc);

        if (
          typeof loc.position.lat === "number" &&
          typeof loc.position.lon === "number"
        ) {
          // bounds.extend accepts [lng, lat] array or LngLat object
          bounds.extend([loc.position.lon, loc.position.lat]);
        } else {
          console.warn(
            "⚠️ Skipping bounds.extend due to invalid coordinates:",
            loc.position
          );
        }
      });

      map.fitBounds(bounds, { padding: mapPadding });
      setMessage(`Found ${categorySearchData.results.length} charging stations.`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      console.error("Error in findStations:", error);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container py-8">
        <h2 className="section-title">Find EV Charging Stations</h2>
        <div className="map-controls">
          <input
            type="text"
            placeholder="Enter location (e.g., Bangalore)"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            disabled={!map}
          />
          <input
            type="number"
            placeholder="Distance (km)"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            min={1}
            disabled={!map}
          />
          <button onClick={findStations} disabled={!map || !locationQuery.trim()}>
            {map ? "Search Stations" : "Loading map..."}
          </button>
        </div>
        {message && <p className="map-summary">{message}</p>}
        <div className="map-container">
          <div id="map" ref={mapContainerRef} className="w-full h-[500px]" />
        </div>
      </main>
      <Footer />
    </>
  );
}
