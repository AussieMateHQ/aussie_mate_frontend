import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
  Polyline,
  Circle,
} from "@react-google-maps/api";
import { Clock, MapPin } from "lucide-react";
import Marker1Icon from "../../assets/marker1.svg";
import Marker2Icon from "../../assets/marker2.svg";
import Loader from "../common/Loader";

// Define libraries outside component to prevent re-creation
const GOOGLE_MAPS_LIBRARIES = ["places"];
const containerStyle = { width: "100%", height: "100%", borderRadius: "1rem" };

const MapWithRealtimeTracking = ({ customerLocation, cleanerLocation: externalCleanerLocation, onRouteInfo, hasArrived }) => {
  const [cleanerLocation, setCleanerLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [polylinePath, setPolylinePath] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  const [liveTime, setLiveTime] = useState(null);
  const mapRef = useRef(null);
  const initialCleanerLocationRef = useRef(null);
  const lastApiCallRef = useRef(null);
  const lastCleanerLocationRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isCalculatingRouteRef = useRef(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;

  // Memoize loader options to prevent re-initialization
  const loaderOptions = useMemo(() => ({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  }), [apiKey]);

  const { isLoaded } = useJsApiLoader(loaderOptions);

  // Use external cleaner location if provided, otherwise track internally
  useEffect(() => {
    if (externalCleanerLocation) {
      setCleanerLocation(externalCleanerLocation);
      initialCleanerLocationRef.current = externalCleanerLocation;
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    // Get initial location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCleanerLocation(newLocation);
        initialCleanerLocationRef.current = newLocation;
      },
      (error) => {
        console.error("❌ Error getting initial location:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        // Show user-friendly error
        if (error.code === 1) {
          alert("Location permission denied. Please enable location access in your browser settings.");
        } else if (error.code === 2) {
          alert("Location unavailable. Please check your GPS/network connection.");
        } else if (error.code === 3) {
          alert("Location request timed out. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );

    // Then watch for updates with less frequent updates
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCleanerLocation(newLocation);
      },
      (error) => {
        console.error("❌ Error watching location:", error);
        console.error("Watch error code:", error.code);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
    );

    // Polling interval for testing with Chrome Sensors
    const pollingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCleanerLocation(newLocation);
        },
        (error) => {
          // Silently ignore timeout errors in polling (they're expected)
          if (error.code !== 3) {
            console.error("❌ Polling error:", error.code, error.message);
          }
        },
        { enableHighAccuracy: false, maximumAge: 1000, timeout: 10000 }
      );
    }, 10000); // Poll every 10 seconds

    return () => {
      navigator.geolocation.clearWatch(watcher);
      clearInterval(pollingInterval);
    };
  }, [externalCleanerLocation]);

  // Helper function to calculate distance between two coordinates (in meters)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Fetch directions with debouncing and throttling
  const fetchDirections = useCallback(() => {
    if (!isLoaded || !customerLocation || !cleanerLocation || isCalculatingRouteRef.current || hasArrived) {
      return;
    }

    const now = Date.now();
    const lastCall = lastApiCallRef.current;

    // Hard throttle: 3 seconds
    if (lastCall && now - lastCall < 3000) return;

    // Mark as calculating to prevent concurrent calls
    isCalculatingRouteRef.current = true;
    lastApiCallRef.current = now;
    lastCleanerLocationRef.current = { ...cleanerLocation };

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route({
      origin: cleanerLocation,
      destination: customerLocation,
      travelMode: window.google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      isCalculatingRouteRef.current = false;

      if (status === 'OK' && result) {
        setDirections(result);

        const route = result.routes[0].legs[0];
        const newRouteInfo = {
          distance: route.distance.text,
          duration: route.duration.text,
          distanceValue: route.distance.value,
          durationValue: route.duration.value,
        };
        setRouteInfo(newRouteInfo);

        // Fit bounds to show the entire route
        if (mapRef.current) {
          const bounds = new window.google.maps.LatLngBounds();
          result.routes[0].overview_path.forEach(point => bounds.extend(point));
          bounds.extend(cleanerLocation);
          bounds.extend(customerLocation);
          mapRef.current.fitBounds(bounds, { top: 120, bottom: 50, left: 50, right: 50 });
        }

        // Extract polyline path from directions
        const path = [];
        result.routes[0].overview_path.forEach(point => {
          path.push({ lat: point.lat(), lng: point.lng() });
        });
        setPolylinePath(path);

        // Send route info to parent
        if (onRouteInfo) {
          onRouteInfo(newRouteInfo);
        }
      } else {
        console.error('❌ Directions failed:', status);
      }
    });
  }, [cleanerLocation, customerLocation, isLoaded, onRouteInfo]);

  // Debounced effect to fetch directions
  useEffect(() => {
    if (!isLoaded || !customerLocation || !cleanerLocation) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: wait 0.5s before calling API
    debounceTimerRef.current = setTimeout(() => {
      fetchDirections();
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cleanerLocation, customerLocation, isLoaded, fetchDirections]);


  const onMapLoad = useCallback((map) => {
    mapRef.current = map;

    // Fit initial bounds if locations are available
    if (cleanerLocation && customerLocation) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(cleanerLocation);
      bounds.extend(customerLocation);
      map.fitBounds(bounds, { top: 100, bottom: 50, left: 50, right: 50 });
    }
  }, [cleanerLocation, customerLocation]);

  // Real-time local calculation for smooth updates
  useEffect(() => {
    if (!cleanerLocation || !customerLocation) return;

    const distanceMeters = calculateDistance(
      cleanerLocation.lat,
      cleanerLocation.lng,
      customerLocation.lat,
      customerLocation.lng
    );

    const distanceKm = (distanceMeters / 1000).toFixed(2);

    // Estimate time based on average speed (e.g., 40 km/h)
    const speed = 40; // km/h
    const timeMin = Math.round((distanceKm / speed) * 60);

    setLiveDistance(distanceKm);
    setLiveTime(timeMin);
  }, [cleanerLocation, customerLocation]);

  if (!isLoaded) return <Loader message="Loading Google Maps..." />;
  if (!customerLocation) return <div className="h-96 flex items-center justify-center bg-gray-50 text-gray-500 font-medium font-inter shadow-inner rounded-3xl">Customer location not available</div>;
  if (!cleanerLocation) return <div className="h-96 flex items-center justify-center bg-gray-50 text-gray-500 font-medium italic animate-pulse font-inter shadow-inner rounded-3xl">Fetching your real-time location...</div>;

  return (
    <div className="w-full h-96 rounded-3xl relative overflow-hidden border border-gray-100 shadow-xl transition-all duration-500">
      {/* Route Information Overlay */}
      {/* No longer showing overlay cards as per user's request */}

      <GoogleMap
        mapContainerStyle={containerStyle}
        onLoad={onMapLoad}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
            { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
            { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
            { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
            { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
          ],
        }}
      >
        {/* Directions Renderer for the route */}
        {!hasArrived && directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#1D4ED8", // More vibrant blue
                strokeWeight: 7,
                strokeOpacity: 0.9,
              },
            }}
          />
        )}

        {/* Cleaner Marker (Start) */}
        <Marker
          position={cleanerLocation}
          title="You (Cleaner)"
          icon={{
            url: Marker1Icon,
            scaledSize: new window.google.maps.Size(44, 44),
            anchor: new window.google.maps.Point(22, 22),
          }}
          zIndex={10}
        />

        {/* Customer Marker (Destination) */}
        <Marker
          position={customerLocation}
          title="Customer"
          icon={{
            url: Marker2Icon,
            scaledSize: new window.google.maps.Size(50, 50),
            anchor: new window.google.maps.Point(25, 50), // Anchor at the bottom for pin
          }}
          zIndex={5}
        />

        {/* Destination Reach Circle (Figma Style) */}
        <Circle
          center={customerLocation}
          radius={120} // ~120 meter radius
          options={{
            strokeColor: "#3B82F6",
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: "#3B82F6",
            fillOpacity: 0.1,
            clickable: false,
            draggable: false,
            editable: false,
            visible: true,
            zIndex: 1
          }}
        />
      </GoogleMap>
    </div>
  );
};

export default MapWithRealtimeTracking;
