import { useState, useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: string;
}

export function useLocation(onAlert: (type: string, message: string) => void) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Initialize location with high accuracy
  useEffect(() => {
    if (navigator.geolocation) {
      console.log('Requesting initial location with high accuracy...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocation(loc);
          console.log('Initial location acquired:', {
            lat: loc.lat.toFixed(6),
            lng: loc.lng.toFixed(6),
            accuracy: `±${loc.accuracy.toFixed(0)}m`
          });
          onAlert('success', `Location acquired (±${loc.accuracy.toFixed(0)}m accuracy)`);
        },
        (err) => {
          console.error('Location error:', err);
          onAlert('error', `Failed to get location: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      onAlert('error', 'Geolocation not supported by this browser');
    }
  }, [onAlert]);

  const startTracking = () => {
    if ('geolocation' in navigator) {
      setIsTracking(true);
      console.log('Starting live tracking with high accuracy GPS...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocation(newLocation);
          console.log('Location updated:', {
            lat: newLocation.lat.toFixed(6),
            lng: newLocation.lng.toFixed(6),
            accuracy: `±${newLocation.accuracy.toFixed(0)}m`,
            speed: position.coords.speed ? `${position.coords.speed.toFixed(1)} m/s` : 'N/A'
          });
        },
        (error) => {
          console.error('Location tracking error:', error);
          onAlert('error', 'Location tracking error: ' + error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );
      onAlert('info', 'Live tracking started - GPS enabled');
    } else {
      onAlert('error', 'Geolocation not supported');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    onAlert('info', 'Tracking stopped');
  };

  return {
    location,
    isTracking,
    startTracking,
    stopTracking
  };
}
