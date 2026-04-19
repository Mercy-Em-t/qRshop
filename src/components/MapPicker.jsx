import { useState, useEffect, useRef } from "react";

/**
 * MapPicker Component
 * Loads Google Maps JS API and allows users to pick a location pin.
 * @param {Object} props
 * @param {Function} props.onLocationSelect - callback with { latitude, longitude, address }
 * @param {Object} props.initialLocation - { latitude, longitude }
 */
export default function MapPicker({ onLocationSelect, initialLocation }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Google Maps Script
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!API_KEY) {
      setError("Google Maps API Key missing. Please check VITE_GOOGLE_MAPS_KEY.");
      setLoading(false);
      return;
    }

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Failed to load Google Maps.");
        setLoading(false);
      };
      document.head.appendChild(script);
    }

    function initMap() {
      const center = initialLocation || { lat: -1.286389, lng: 36.817223 }; // Default Nairobi
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const newMarker = new window.google.maps.Marker({
        position: center,
        map: newMap,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });

      setMap(newMap);
      setMarker(newMarker);
      setLoading(false);

      // Listen for click on map to move marker
      newMap.addListener("click", (e) => {
        const pos = e.latLng;
        newMarker.setPosition(pos);
        handleLocationChange(pos);
      });

      // Listen for marker drag end
      newMarker.addListener("dragend", (e) => {
        handleLocationChange(e.latLng);
      });

      // Try to get user's current location to center map
      if (!initialLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const uPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          newMap.setCenter(uPos);
          newMarker.setPosition(uPos);
          handleLocationChange(uPos);
        });
      }
    }

    function handleLocationChange(latLng) {
      const lat = latLng.lat();
      const lng = latLng.lng();
      
      // Reverse Geocode to get address (Optional but helpful)
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: latLng }, (results, status) => {
        let address = "";
        if (status === "OK" && results[0]) {
          address = results[0].formatted_address;
        }
        onLocationSelect({ latitude: lat, longitude: lng, address });
      });
    }

  }, []);

  if (error) return (
    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
      <p className="text-red-500 text-xs font-bold uppercase mb-1">Map Error</p>
      <p className="text-[10px] text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="relative w-full h-64 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/20 z-10 pointer-events-none">
        <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
          📍 Drag the pin to your exact door
        </p>
      </div>
    </div>
  );
}
