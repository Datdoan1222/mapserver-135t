import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { Button, notification, Input } from "antd";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import axios from "axios";

function Routing({ showMenu, mapInstance }) {
  const [api, contextHolder] = notification.useNotification();
  const { Search } = Input;
  const [startResults, setStartResults] = useState([]);
  const [endResults, setEndResults] = useState([]);
  const [status, setStatus] = useState("start");
  const [polyline, setPolyline] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState(null);
  const grayIcon = L.icon({
    iconUrl: "https://img.icons8.com/fluency/48/marker.png",
    iconSize: [40, 45],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const markerGroup = L.layerGroup().addTo(mapInstance);

  useEffect(() => {
    const onMapClick = (e) => {
      if (mapInstance) {
        const latLng = e.latlng;
        markerGroup.clearLayers();

        if (status === "start") {
          if (startMarker) mapInstance.removeLayer(startMarker);

          const marker = L.marker([latLng.lat, latLng.lng], {
            icon: grayIcon,
          }).addTo(markerGroup);

          setStartMarker(marker);
          setStartLocation([latLng.lat.toFixed(6), latLng.lng.toFixed(6)]);
        } else if (status === "end") {
          // Xử lý chọn điểm đến
          if (endMarker) mapInstance.removeLayer(endMarker);

          const marker = L.marker([latLng.lat, latLng.lng], {
            icon: grayIcon,
          }).addTo(markerGroup);

          setEndMarker(marker);
          setEndLocation([latLng.lat.toFixed(6), latLng.lng.toFixed(6)]);
        }
      }
    };
    mapInstance.on("click", onMapClick);

    return () => {
      mapInstance.off("click", onMapClick);
    };
  }, [mapInstance, status, startMarker, endMarker]);

  const getDirections = async () => {
    if (!startLocation && !endLocation) {
      api.error({
        message: "Chưa có điểm đến và điểm đi",
        description: "Lộ trình không hợp lệ hoặc không có kết quả.",
      });
      return;
    }
    const url = `http://mapserver.click:8989/route?point=${startLocation[0]},${startLocation[1]}&point=${endLocation[0]},${endLocation[1]}&type=json&profile=car`;
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Không thể lấy dữ liệu từ API");
      }

      const result = await response.json();

      if (result && result.paths && result.paths.length > 0) {
        const path = result.paths[0].points;
        const decodedPath = decodePolyline(path);
        if (polyline) {
          mapInstance.removeLayer(polyline);
        }
        // Lấy thời gian ước tính từ kết quả
        const durationInSeconds = result.paths[0].time;
        const timeRouting = formatDuration(durationInSeconds);

        const newPolyline = L.polyline(decodedPath, {
          color: "blue",
          weight: 8,
          lineCap: "round",
        }).addTo(mapInstance);
        newPolyline.bindTooltip(timeRouting, {
          permanent: true,
          className: "custom-tooltip",
        });
        console.log("====================================");
        console.log(timeRouting);
        console.log("====================================");
        setPolyline(newPolyline);

        mapInstance.fitBounds(newPolyline.getBounds());
      } else {
        api.error({
          message: "Không tìm thấy lộ trình",
          description: "Lộ trình không hợp lệ hoặc không có kết quả.",
        });
      }
    } catch (error) {
      api.error({
        message: "Lỗi",
        description: `Không thể lấy chỉ đường: ${error.message}`,
      });
      console.log(error.message);
    }
  };

  // Hàm giải mã polyline từ GraphHopper
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;
    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  };
  const formatDuration = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    setEstimatedTime(`${hours} giờ ${minutes} phút`); // Lưu thời gian đã định dạng
    return `${hours} giờ ${minutes} phút`;
  };

  const LocationInput = ({
    type,
    location,
    results,
    setLocation,

    onSearch,
  }) => {
    return (
      <div className="item-routing">
        <div className="contai-text">
          <text className="text">
            {type === "start" ? "Điểm Bắt Đầu" : "Điểm Kết Thúc"}
          </text>
        </div>
        <div className="row">
          <Search
            className="search"
            size="large"
            onSearch={(query) => onSearch(query, type)}
            onChange={(e) => setLocation(e.target.value)}
            value={location}
          />

          <Button className="btn-mylocation" onClick={() => setStatus(type)}>
            Chọn vị trí
            <MyLocationIcon className="icon" />
          </Button>
        </div>
      </div>
    );
  };
  return (
    <div className="container-add">
      {contextHolder}
      <LocationInput
        type="start"
        location={startLocation}
        results={startResults}
        setLocation={setStartLocation}
        // onSearch={searchLocation}
      />
      <LocationInput
        type="end"
        location={endLocation}
        results={endResults}
        setLocation={setEndLocation}
        // onSearch={searchLocation}
      />

      <Button className="btn-add" onClick={getDirections}>
        Tìm đường
      </Button>
    </div>
  );
}
export default Routing;
