import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { Button, notification, Space, Input, Select } from "antd";
function App() {
  const { TextArea } = Input;
  const [showMenu, setShowMenu] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [polylineInstance, setPolylineInstance] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [name, setName] = useState("");
  const [highway, setHighway] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [latAddlocation, setLatAddlocation] = useState(null);
  const [lngAddlocation, setLngAddlocation] = useState(null);
  const [amenity, setAmenity] = useState("");
  const [coordinatesTextArea, setCoordinatesTextArea] = useState("");

  const [amenityOptions, setAmenityOptions] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const localhost = "http://mapserver.click";
  const mapRef = React.useRef(null);

  const openNotificationWithIcon = (type) => {
    api[type]({
      message: "Notification Title",
      description:
        "This is the content of the notification. This is the content of the notification. This is the content of the notification.",
    });
  };
  useEffect(() => {
    const map = L.map(mapRef.current, { zoomControl: false }).setView(
      [10.9520257, 106.7988026],
      17
    );

    setMapInstance(map);

    L.tileLayer(`http://mapserver.click/osm/{z}/{x}/{y}.png`, {
      maxZoom: 20,
      attribution: "DoanAnhDatMap",
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [showMenu]);
  useEffect(() => {
    if (!mapInstance) return;

    const handleMapClick = (e) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      const grayIcon = L.icon({
        iconUrl: "https://img.icons8.com/deco/48/marker.png",
        iconSize: [40, 45],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Xóa marker cũ trước khi thêm marker mới
      if (tempMarker) {
        mapInstance.removeLayer(tempMarker);
      }

      const marker = L.marker([lat, lng], { icon: grayIcon }).addTo(
        mapInstance
      );
      setTempMarker(marker);
      setLatAddlocation(lat);
      setLngAddlocation(lng);
    };

    if (!showMenu) {
      mapInstance.on("click", handleMapClick);
    } else {
      mapInstance.on("click", function (e) {
        setCoordinates((prevCoordinates) => [
          ...prevCoordinates,
          [e.latlng.lat, e.latlng.lng],
        ]);
        updateCoordinatesTextArea();
      });
    }

    // Cleanup sự kiện click khi component unmount hoặc khi `showMenu` thay đổi
    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [mapInstance, showMenu, tempMarker]);
  useEffect(() => {
    if (coordinates.length > 1 && mapInstance) {
      // Check if polylineInstance is already set, otherwise create a new polyline
      if (!polylineInstance) {
        const newPolyline = L.polyline(coordinates, { color: "blue" }).addTo(
          mapInstance
        );
        setPolylineInstance(newPolyline); // Save the reference to the polyline
      } else {
        polylineInstance.setLatLngs(coordinates); // Update the polyline with new coordinates
      }
    }
    if (coordinates.length === 0 && polylineInstance) {
      // If there are no coordinates left, remove the polyline
      polylineInstance.remove();
      setPolylineInstance(null);
    }
  }, [coordinates, mapInstance]);
  const updateCoordinatesTextArea = () => {
    const coordsText = coordinates
      .map((coord) => `(${coord[0]}, ${coord[1]})`)
      .join("\n");
    // document.getElementById("coordinates").value = coordsText;
  };

  const clearLine = () => {
    setCoordinates([]); // Clear the coordinates
    if (polylineInstance) {
      polylineInstance.remove(); // Remove the polyline from the map
      setPolylineInstance(null); // Reset the polyline instance reference
    }
    document.getElementById("coordinates").value = ""; // Clear the coordinates text area
  };

  const undoLastPoint = () => {
    setCoordinates((prevCoordinates) => {
      const newCoordinates = [...prevCoordinates];
      newCoordinates.pop(); // Remove the last point from the array
      return newCoordinates;
    });
  };

  const sendLineToServer = async () => {
    if (!name || !highway || coordinates.length < 2) {
      alert("Vui lòng nhập đầy đủ thông tin và chọn ít nhất 2 điểm.");
      return;
    }

    const data = { name, highway, coordinates };

    try {
      const response = await fetch(`${localhost}/add-line`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("Đường đã được thêm thành công.");
      } else {
        alert("Có lỗi khi thêm đường.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error);
      alert("Đã xảy ra lỗi khi thêm đường.");
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(`${localhost}:5000/api/categories`);
      const categories = await response.json();
      setAmenityOptions(categories);
    } catch (error) {
      console.error("Lỗi khi tải categories:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addLocation = async () => {
    if (!name || !latitude || !longitude || !amenity) {
      alert("Vui lòng nhập đầy đủ thông tin địa điểm.");
      return;
    }

    const locationData = {
      name,
      amenity,
      lon: longitude,
      lat: latitude,
    };

    try {
      const response = await fetch(`${localhost}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      });

      if (response.ok) {
        alert("Địa điểm đã được thêm thành công!");
      } else {
        alert("Có lỗi xảy ra khi thêm địa điểm.");
      }
    } catch (error) {
      console.error("Lỗi khi thêm địa điểm:", error);
      alert("Đã xảy ra lỗi khi thêm địa điểm.");
    }
  };

  const AddLocation = () => {
    return (
      <div className="container-add">
        <Input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên địa điểm"
        />
        <Input
          className="input"
          type="number"
          id="latitude"
          value={latAddlocation}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Vĩ độ"
          step="any"
          readOnly
        />
        <Input
          className="input"
          type="number"
          id="longitude"
          value={lngAddlocation}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Kinh độ"
          step="any"
          readOnly
        />
        <Select
          className="input"
          defaultValue="cafe"
          value={amenity}
          onChange={(value) => setAmenity(value)}
          placeholder="Thể loại"
        >
          <Select.Option value="">Chọn thể loại</Select.Option>
          {amenityOptions.map((option) => (
            <Select.Option key={option.name} value={option.name}>
              {option.name}
            </Select.Option>
          ))}
        </Select>
        <Button className="btn-add" onClick={addLocation}>
          Thêm địa điểm
        </Button>
      </div>
    );
  };
  const AddStress = () => {
    return (
      <div className="container-add">
        <Input
          className="input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên đường"
        />

        <Input
          className="input"
          type="text"
          value={highway}
          onChange={(e) => setHighway(e.target.value)}
          placeholder="Nhập loại đường"
        />

        <TextArea
          id="coordinates"
          rows={5}
          cols={30}
          placeholder="Tọa độ của các điểm sẽ được hiển thị ở đây..."
          value={coordinates
            .map(
              (coord, index) =>
                `(${coord[0].toFixed(6)}, ${coord[1].toFixed(6)})`
            )
            .join("\n")}
          readOnly
        />

        <Button className="btn-street" onClick={clearLine}>
          Xóa Đường
        </Button>
        <Button className="btn-street" onClick={undoLastPoint}>
          Quay lại bước trước
        </Button>
        <Button className="btn-add" onClick={sendLineToServer}>
          Gửi Đường
        </Button>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="btn-menu">
        <Button
          className="btn"
          type={!showMenu ? "primary" : ""}
          onClick={() => setShowMenu(false)}
        >
          Thêm địa điểm
        </Button>
        <Button
          className="btn"
          type={showMenu ? "primary" : ""}
          onClick={() => setShowMenu(true)}
        >
          Thêm đường
        </Button>
      </div>
      {!showMenu && <AddLocation />}
      {showMenu && <AddStress />}

      <div id="map" ref={mapRef} style={{ height: "100vh" }}></div>
    </div>
  );
}

export default App;
