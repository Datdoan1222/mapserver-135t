import React, { useEffect, useState } from "react";
import L from "leaflet";
import { Button, notification, Space, Input, Select } from "antd";
function AddStress({ mapInstance, showMenu }) {
  const { TextArea } = Input;
  const [api, contextHolder] = notification.useNotification();
  const [polylineInstance, setPolylineInstance] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [name, setName] = useState("");
  const [highway, setHighway] = useState("");

  const [coordinatesTextArea, setCoordinatesTextArea] = useState("");

  const [highwayOptions, setHighwayOptions] = useState([]);
  const localhost = "http://mapserver.click";
  const mapRef = React.useRef(null);

  useEffect(() => {
    loadCategories();
    if (!mapInstance) return;

    const handleMapClick = (e) => {
      setCoordinates((prevCoordinates) => [
        ...prevCoordinates,
        [e.latlng.lat, e.latlng.lng],
      ]);
    };
    mapInstance.on("click", handleMapClick);

    return () => {
      mapInstance.off("click", handleMapClick);
    };
  }, [mapInstance]);

  useEffect(() => {
    updateCoordinatesTextArea();
    if (coordinates.length > 1 && mapInstance) {
      // Kiểm tra nếu polylineInstance đã có, nếu không thì tạo mới
      if (!polylineInstance) {
        const newPolyline = L.polyline(coordinates, {
          color: "blue",
        }).addTo(mapInstance);

        setPolylineInstance(newPolyline); // Lưu tham chiếu polyline
      } else {
        polylineInstance.setLatLngs(coordinates); // Cập nhật polyline với tọa độ mới
      }
    }
    if (coordinates.length === 0 && polylineInstance) {
      // Nếu không còn tọa độ, loại bỏ polyline
      polylineInstance.remove();
      setPolylineInstance(null);
    }
  }, [coordinates]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${localhost}:5000/api/highway`);
      const categories = await response.json();
      setHighwayOptions(categories);
    } catch (error) {
      console.error("Lỗi khi tải categories:", error);
    }
  };
  const updateCoordinatesTextArea = () => {
    const coordsText = coordinates
      .map((coord) => `(${coord[0].toFixed(6)}, ${coord[1].toFixed(6)})`)
      .join("\n");

    setCoordinatesTextArea(coordsText);
  };
  const clearLine = () => {
    setCoordinates([]); // Clear the coordinates
    if (polylineInstance) {
      polylineInstance.remove(); // Remove the polyline from the map
      setPolylineInstance(null); // Reset the polyline instance reference
    }
    setCoordinatesTextArea("");
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
      api.error({
        message: "Thất bại",
        description: "Vui lòng nhập đầy đủ thông tin và chọn ít nhất 2 điểm.",
      });
      return;
    }

    const data = { name, highway, coordinates };
    try {
      const response = await fetch(`${localhost}:5000/add-line`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        api.success({
          message: "Thành công",
          description: "Đường đã được thêm thành công.",
        });
        setName("");
        setHighway("");
        setCoordinatesTextArea("");
        clearLine();
      } else {
        api.error({
          message: "Thất bại",
          description: "Có lỗi khi thêm đường.",
        });
      }
    } catch (error) {
      api.error({
        message: "Thất Bại",
        description: `Lỗi khi thêm đường:, ${error}`,
      });
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
        placeholder="Nhập tên đường"
      />

      <Select
        className="input"
        onChange={(value) => setHighway(value)}
        placeholder="Thể loại"
      >
        <Select.Option value="">Chọn thể loại Đường</Select.Option>
        {highwayOptions.map((option) => (
          <Select.Option key={option.name} value={option.name}>
            {option.name}
          </Select.Option>
        ))}
      </Select>
      <TextArea
        className="input"
        rows={5}
        cols={30}
        placeholder="Tọa độ của các điểm sẽ được hiển thị ở đây..."
        value={coordinatesTextArea}
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
}
export default AddStress;
