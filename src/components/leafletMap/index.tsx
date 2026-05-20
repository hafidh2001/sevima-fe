import { useEffect, useRef } from "react";

// Define types for Leaflet
interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  coordinates?: string | null;
  defaultCenter?: string;
  assetName?: string;
  className?: string;
  height?: string;
  showMarker?: boolean;
  useSatellite?: boolean;
}

declare global {
  interface Window {
    L: any;
  }
}

export const LeafletMap = ({
  coordinates,
  defaultCenter = "-6.2088,106.8456",
  assetName,
  className = "",
  height = "300px",
  showMarker = true,
  useSatellite = false
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Parse coordinates from string format
  const parseCoordinates = (coordString: string | null | undefined): LatLng | null => {
    if (!coordString || typeof coordString !== 'string') return null;
    
    // Handle different coordinate formats
    // Format 1: "lat,lng" or "lat, lng"
    // Format 2: "latitude: xxx, longitude: yyy"
    
    const cleanCoord = coordString.trim();
    
    // Try comma-separated format first
    if (cleanCoord.includes(',')) {
      const parts = cleanCoord.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    
    // Try format with latitude/longitude labels
    const latMatch = cleanCoord.match(/lat(?:itude)?[:\s]*(-?\d+\.?\d*)/i);
    const lngMatch = cleanCoord.match(/lng|lon(?:gitude)?[:\s]*(-?\d+\.?\d*)/i);
    
    if (latMatch && lngMatch) {
      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    return null;
  };

  useEffect(() => {
    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Check if Leaflet is already loaded
        if (window.L) {
          initializeMap();
          return;
        }
      }, 100);
      
      try {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
        
        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.crossOrigin = '';
        script.onload = () => {
          // Fix for default markers
          if (window.L) {
            delete (window.L.Icon.Default.prototype as any)._getIconUrl;
            window.L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });
          }
          initializeMap();
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.L) return;
      
      // Clean up existing map instance more thoroughly
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing existing map:', e);
        }
        mapInstanceRef.current = null;
      }
      
      // Clear the container and reset its state
      const container = mapRef.current;
      if (container) {
        container.innerHTML = '';
        // Remove any Leaflet-specific properties
        delete (container as any)._leaflet_id;
        container.className = container.className.replace(/leaflet-\S*/g, '');
      }
      
      const coords = parseCoordinates(coordinates);
      const defaultCoords = parseCoordinates(defaultCenter);
      
      // Use asset coordinates if available, otherwise use default center
      const lat = coords?.lat ?? defaultCoords?.lat ?? -6.2088;
      const lng = coords?.lng ?? defaultCoords?.lng ?? 106.8456;
      
      // Create map with unique container
      const mapContainer = mapRef.current;
      if (!mapContainer) return;
      
      mapContainer.style.height = height;
      mapContainer.style.width = '100%';
      
      try {
        // Add a small delay to ensure container is ready
        setTimeout(() => {
          if (!mapContainer || mapInstanceRef.current) return;
          
          // Create map - zoom closer if we have actual coordinates, wider if default
          const map = window.L.map(mapContainer, {
            center: [lat, lng],
            zoom: coords ? 15 : 10,
            scrollWheelZoom: false,
            zoomControl: true
          });
          mapInstanceRef.current = map;
      
          // Add tile layer - use satellite if requested
          if (useSatellite) {
            // Using Esri World Imagery satellite tiles
            window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
              maxZoom: 19,
              minZoom: 3
            }).addTo(map);

            // Add labels overlay for satellite view
            window.L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
              attribution: '',
              maxZoom: 19,
              minZoom: 3,
              opacity: 0.8
            }).addTo(map);
          } else {
            // Use standard OpenStreetMap tiles
            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 18,
              minZoom: 3
            }).addTo(map);
          }
      
          // Only add marker if showMarker is true and we have coordinates
          if (showMarker && coords && coordinates) {
            const marker = window.L.marker([lat, lng]).addTo(map);
            
            if (assetName) {
              marker.bindPopup(`<b>${assetName}</b><br/>${coordinates}`).openPopup();
            }
          }
          
          // Force a resize to ensure proper rendering
          setTimeout(() => {
            if (map && mapInstanceRef.current) {
              map.invalidateSize();
            }
          }, 250);
        }, 100);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    loadLeaflet();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error cleaning up map:', e);
        }
        mapInstanceRef.current = null;
      }
      
      // Clean up container
      if (mapRef.current) {
        delete (mapRef.current as any)._leaflet_id;
        mapRef.current.innerHTML = '';
      }
    };
  }, [coordinates, defaultCenter, assetName, useSatellite]);

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%', position: 'relative', zIndex:10 }}
      className={`leaflet-map-container ${className || ''}`}
      id={`leaflet-map-${Date.now()}`}
    />
  );
};