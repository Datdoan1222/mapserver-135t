import { Input, notification } from "antd";
import React, { useEffect, useState } from "react";
import axios from "axios";
import L from "leaflet";

let debounceTimer;

function SearchLocation({ mapInstance }) {
  const [api, contextHolder] = notification.useNotification();
  const { Search } = Input;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentMarker, setCurrentMarker] = useState(null);

  useEffect(() => {
    if (query) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchLocation(query);
      }, 500);
    } else {
      setResults([]);
    }
  }, [query, currentMarker]);
  const searchLocation = async (searchQuery) => {
    try {
      const response = await axios.get(`http://mapserver.click:5000/geocode`, {
        params: { query: searchQuery },
      });

      setResults(response.data);
    } catch (err) {
      setResults([]);
    }
  };
  const handleClickLocation = (lon, lat, resultName) => {
    setQuery(resultName);
    setResults([]);
    const grayIcon = L.icon({
      iconUrl: "https://img.icons8.com/?size=64&id=h1ACssMxjHCf&format=png",
      iconSize: [40, 45],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
    if (mapInstance) {
      if (currentMarker) {
        mapInstance.removeLayer(currentMarker);
      }

      const newMarker = L.marker([lat, lon], { icon: grayIcon }).addTo(
        mapInstance
      );
      setCurrentMarker(newMarker);
      mapInstance.setView([lat, lon], 15);
    }
  };

  const focus = () => {
    setQuery("");
  };
  return (
    <div>
      {contextHolder}
      <Search
        className="search"
        placeholder="Nhập địa điểm"
        size="large"
        allowClear
        onSearch={searchLocation}
        onChange={(e) => setQuery(e.target.value)}
        value={query}
        style={{
          width: 400,
        }}
        onFocus={focus}
      />
      {results.length > 0 && (
        <div className="info-search">
          {results.map((result, index) => (
            <div
              className="info-search-item"
              key={index}
              onClick={() =>
                handleClickLocation(result.lon, result.lat, result.name)
              }
            >
              <text className="item-name">{result.name}</text>
              <br />
              <text className="item-latlng">
                Tọa độ: {result.lon.toFixed(6)}, {result.lat.toFixed(6)}
              </text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchLocation;
