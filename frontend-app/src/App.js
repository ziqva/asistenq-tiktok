import Home from "page/Home";
import Authentication from "page/Authentication";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "antd";
import LiveChat from "element/LiveChat";
import { useEffect, useState } from "react";
import getMachineId from "utils/device/getMachineId";
import FreeFeatureAuthenticator from "page/FreeFeatureAuthenticator";
import FreeFeatureDeleteProduct from "page/FreeFeatureDeleteProduct";
import FreeFeatureUploadProduct from "page/FreeFeatureUploadProduct";
import FreeFeatureTEmplateChat from "page/FreeFeatureTemplateChat";
import FreeFeatureJadwalOperasional from "page/FreeFeatureJadwalOperasional";
import FreeFeatureSetHoliday from "page/FreeFeatureSetHoliday";
import FreeFeatureSetSlogan from "page/FreeFeatureSetSlogan";
import FreeFeatureAturPengiriman from "page/FreeFeatureAturPengiriman";
import server from "config/server";
import { io } from "socket.io-client";
import AOS from "aos";
import "aos/dist/aos.css";
import FreeFeatureAturFotoProfile from "page/FreeFeatureAturfotoProfile";

class LiveChatStat {
  constructor() {
    this.onActiveChange = () => {};
    const socket = io(server.socket.base, {
      auth: {
        from: "live_chat",
      },
    });

    socket.on("live-chat-data", (data) => {
      this.onActiveChange(data.isActive);
    });
  }
}

const liveChatStat = new LiveChatStat();

function App() {
  const [machineId, setMachineId] = useState(null);
  const [liveChatActive, setLiveChatActive] = useState(false);

  useEffect(() => {
    liveChatStat.onActiveChange = (state) => setLiveChatActive(state);

    getMachineId()
      .then((data) => setMachineId(data.machineId))
      .catch((err) => {
        window.alert(
          `Failed for activate the chat feature: ${err.message || err}`,
        );
      });
    AOS.init({});
  }, []);

  return (
    <BrowserRouter>
      {typeof machineId === "string" && liveChatActive && (
        <LiveChat machineID={machineId} />
      )}
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "rgb(25, 118, 210)",
            borderRadius: 13,
          },
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} exact />
          <Route path="/authentication" element={<Authentication />} exact />
          <Route
            path="/free-feature/authenticator"
            element={<FreeFeatureAuthenticator />}
            exact
          />
          <Route
            path="/free-feature/delete-product/:accountId"
            element={<FreeFeatureDeleteProduct />}
            exact
          />
          <Route
            path="/free-feature/product-uploader/:id"
            element={<FreeFeatureUploadProduct />}
            exact
          />
          <Route
            path="/free-feature/template-chat"
            element={<FreeFeatureTEmplateChat />}
            exact
          />
          <Route
            path="/free-feature/jadwal-operasional"
            element={<FreeFeatureJadwalOperasional />}
            exact
          />
          <Route
            path="/free-feature/atur-tanggal-libur"
            element={<FreeFeatureSetHoliday />}
            exact
          />
          <Route
            path="/free-feature/atur-slogan"
            element={<FreeFeatureSetSlogan />}
            exact
          />
          <Route
            path="/free-feature/atur-foto-profil"
            element={<FreeFeatureAturFotoProfile />}
            exact
          />
          <Route
            path="/free-feature/atur-pengiriman"
            element={<FreeFeatureAturPengiriman />}
            exact
          />
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
