"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

interface TomTomMapOptions {
  center?: [number, number];
  zoom?: number;
}

declare global {
  interface Window {
    tt: any;
  }
}

export function useTomTomMap(
  mapContainerRef: React.RefObject<HTMLDivElement>,
  apiKey: string,
  options?: TomTomMapOptions
) {
  const [map, setMap] = useState<any>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) {
      // Map already initialized or no container
      return;
    }

    let isMounted = true;

    const loadTomTomScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.tt && window.tt.map) {
          console.log("✅ TomTom SDK already loaded.");
          resolve();
          return;
        }

        console.log("🟡 Loading TomTom Maps SDK...");
        const script = document.createElement("script");
        script.src =
          "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/maps/maps-web.min.js";
        script.async = true;
        script.onload = () => {
          console.log("✅ TomTom Maps SDK loaded.");
          resolve();
        };
        script.onerror = (err) => {
          console.error("❌ Failed to load TomTom Maps SDK", err);
          reject(err);
        };
        document.head.appendChild(script);
      });
    };

    loadTomTomScript()
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;
        if (!window.tt || !window.tt.map) {
          console.error("❌ window.tt.map is not available after load.");
          return;
        }

        console.log("✅ Creating TomTom map instance...");
        window.tt.setProductInfo("EVapps", "1.0");

        mapInstance.current = window.tt.map({
          key: apiKey,
          container: mapContainerRef.current,
          center: options?.center || [0, 0],
          zoom: options?.zoom || 13,
          ...options,
        });

        mapInstance.current.on("load", () => {
          console.log("✅ TomTom map fully loaded.");
          if (isMounted) {
            setMap(mapInstance.current);
          }
        });
      })
      .catch((error) => {
        console.error("❌ Failed to initialize TomTom map:", error);
      });

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMap(null);
        console.log("🧹 Map instance cleaned up.");
      }
    };
  }, [apiKey, mapContainerRef, JSON.stringify(options)]);

  return map;
}