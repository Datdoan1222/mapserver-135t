import React, { useEffect, useState } from "react";
import L from "leaflet";
import { Button, Input, Select, notification } from "antd";
function AddLocation({ showMenu, mapInstance }) {
  const [name, setName] = useState("");
  const [amenity, setAmenity] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [api, contextHolder] = notification.useNotification();

  const [amenityOptions, setAmenityOptions] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const localhost = "http://mapserver.click";
  const mapRef = React.useRef(null);
  useEffect(() => {
    loadCategories();
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
        setTempMarker(null);
      }

      const marker = L.marker([lat, lng], { icon: grayIcon }).addTo(
        mapInstance
      );
      setTempMarker(marker);
      setLatitude(lat);
      setLongitude(lng);
    };

    if (showMenu) {
      mapInstance.on("click", handleMapClick);
    }

    // Cleanup sự kiện click khi component unmount hoặc khi `showMenu` thay đổi
    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [mapInstance, showMenu, tempMarker]);
  const loadCategories = async () => {
    try {
      const response = await fetch(`${localhost}:5000/api/categories`);
      const categories = await response.json();
      setAmenityOptions(categories);
    } catch (error) {
      api.error({
        message: "Thất bại",
        description: "Không thể tải danh sách thể loại từ server.",
      });
      console.error("Lỗi khi tải categories:", error);
    }
  };

  const addLocation = async () => {
    if (!name || !latitude || !longitude || !amenity) {
      api.error({
        message: "Thất Bại",
        description: "Vui lòng nhập đầy đủ thông tin địa điểm.!",
      });
      return;
    }

    const locationData = {
      name,
      amenity,
      lon: longitude,
      lat: latitude,
    };
    console.log(locationData);

    try {
      const response = await fetch(`${localhost}:5000/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      });
      // Xóa marker tạm sau khi thêm thành công
      if (tempMarker) {
        mapInstance.removeLayer(tempMarker);
        setTempMarker(null);
      }

      // Làm mới bản đồ
      window.location.reload();
      setName("");
      setLatitude(null);
      setLongitude(null);
      setAmenity("");
      if (response.ok) {
        api.success({
          message: "Thành công",
          description: "Địa điểm đã được thêm thành công!",
        });
      } else {
        api.error({
          message: "Thất Bại",
          description: "Có lỗi xảy ra khi thêm địa điểm.",
        });
      }
    } catch (error) {
      api.error({
        message: "Thất Bại",
        description: `Lỗi khi thêm địa điểm:, ${error}`,
      });
      console.error(error);
    }
  };
  return (
    <div className="container-add">
      {contextHolder}
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
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        placeholder="Vĩ độ"
        step="any"
        readOnly
      />
      <Input
        className="input"
        type="number"
        id="longitude"
        value={longitude}
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
        <Select.Option value="">Chọn thể loại Địa điểm</Select.Option>
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
}
export default AddLocation;
