import React, { useEffect, useRef } from 'react';

function MapComponent({ latitude, longitude, businesses }) {
  const mapRef = useRef(null);
  let map = useRef(null);
  const markersRef = useRef([]); // Add ref to store markers

  useEffect(() => {
    if (window.google && window.google.maps) {
      console.log("✅ Google Maps API is available");

      // Clear existing markers
      markersRef.current.forEach(marker => {
        marker.setMap(null);
        google.maps.event.clearInstanceListeners(marker);
      });
      markersRef.current = [];

      if (!map.current) {
        map.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: 12,
        });
      } else {
        map.current.setCenter({ lat: latitude, lng: longitude });
      }

      // 📌 User's location marker
      const userMarker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map.current,
        title: "You are here",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });
      markersRef.current.push(userMarker);

      // 📌 Business markers
      if (Array.isArray(businesses) && businesses.length > 0) {
        businesses.forEach((biz) => {
          if (biz.latitude && biz.longitude) {
            const marker = new window.google.maps.Marker({
              position: { lat: biz.latitude, lng: biz.longitude },
              map: map.current,
              title: biz.name,
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                  <div>
                      <h4>${biz.name}</h4>
                      <p>${biz.address || "No address available"}</p>
                      <p>Rating: ${biz.rating || "No rating"}</p>
                      <a href="https://www.google.com/maps/dir/?api=1&destination=${biz.latitude},${biz.longitude}" target="_blank">Get Directions</a>
                  </div>
              `,
            });

            marker.addListener("click", () => {
              infoWindow.open(map.current, marker);
            });

            markersRef.current.push(marker);
          } else {
            console.warn(`⚠️ Skipping business without location: ${biz.name}`);
          }
        });
      }
    }

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => {
        marker.setMap(null);
        google.maps.event.clearInstanceListeners(marker);
      });
      markersRef.current = [];
    };
  }, [latitude, longitude, businesses]);

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />;
}

export default MapComponent;
