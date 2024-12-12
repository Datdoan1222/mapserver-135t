import "./App.css";
import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { Button } from "antd";
import AddLocation from "./component/AddLocation";
import AddStress from "./component/AddStress";
import Routing from "./component/Routing";
import SearchLocation from "./component/SearchLocation";

function App() {
  const [showMenu, setShowMenu] = useState(1);
  const [mapInstance, setMapInstance] = useState(null);
  const [hidenMenu, setHidenMenu] = useState(false);

  const mapRef = React.useRef(null);
  useEffect(() => {
    const map = L.map(mapRef.current, { zoomControl: false }).setView(
      [10.9520257, 106.7988026],
      17
    );

    setMapInstance(map);

    L.tileLayer(`http://mapserver.click/osm/{z}/{x}/{y}.png`, {
      maxZoom: 20,
    }).addTo(map);
    map.on("zoomend", () => {
      console.log("Current zoom level:", map.getZoom());
    });
    return () => {
      map.remove();
    };
  }, [showMenu]);

  //

  return (
    <div className="container">
      <div className="btn-menu">
        {hidenMenu && (
          <>
            <Button
              className="btn"
              type={showMenu === 1 ? "primary" : ""}
              onClick={() => setShowMenu(1)}
            >
              Thêm địa điểm
            </Button>
            <Button
              className="btn"
              type={showMenu === 2 ? "primary" : ""}
              onClick={() => setShowMenu(2)}
            >
              Thêm đường
            </Button>
            <Button
              className="btn"
              type={showMenu === 3 ? "primary" : ""}
              onClick={() => setShowMenu(3)}
            >
              Chỉ đường
            </Button>
          </>
        )}
        <Button onClick={() => setHidenMenu((prevState) => !prevState)}>
          ...
        </Button>
      </div>
      {showMenu === 1 && hidenMenu && (
        <AddLocation showMenu={showMenu} mapInstance={mapInstance} />
      )}
      {showMenu === 2 && hidenMenu && (
        <AddStress showMenu={showMenu} mapInstance={mapInstance} />
      )}
      {showMenu === 3 && hidenMenu && (
        <Routing showMenu={showMenu} mapInstance={mapInstance} />
      )}
      <div className="container-search">
        <SearchLocation mapInstance={mapInstance} />
      </div>
      <div id="map" ref={mapRef} style={{ height: "100vh" }}></div>
    </div>
  );
}
export default App;
