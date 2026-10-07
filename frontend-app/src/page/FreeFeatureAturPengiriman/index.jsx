import FreeFeatureHeader from "element/FreeFeatureHeader";
import { useEffect, useState } from "react";
import "./index.scss";
import {
  Button,
  Spin,
  Empty,
  Popconfirm,
  Typography,
  Dropdown,
  Alert,
} from "antd";
import SelectAccount from "./SelectAccount";
import SetDays from "./SetDays";
import WrapperSelectOne from "./WrapperSelectOne";
import MainData from "utils/free-feature/slogan/MainData";
import Logs from "./Logs";
import InfoIcon from "@mui/icons-material/InfoRounded";
import axios from "axios";
import server from "config/server";
import ShipperSelector from "./ShipperSelector";
import { Tooltip } from "@mui/material";
import apply from "utils/free-feature/shipping-manager/apply";

let refreshLogsInt

export default function FreeFeatureAturPengiriman() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [logShow, setLogShow] = useState(false);
  const [data, setData] = useState({ slogans: [], descriptions: [] });
  const [shipperSelected, setShipperSelected] = useState([])

  const refreshLogs = () => {
    const url = `${server.api.base}/freeFeature/shippingManager/logs`
    axios.get(url)
      .then(({data}) => {
        console.log(data)
        setLogs(data)
      })
      .catch(err => console.error(err.message || err))
  } 

  useEffect(() => {
    if(refreshLogsInt) { clearInterval(refreshLogsInt) }
    if(running) {
      refreshLogsInt = setInterval(refreshLogs, 1500)
    }
    console.log({running})
    refreshLogs()
  }, [running])

  useEffect(() => {
    document.title = "Free Feature | Atur Pengiriman";
  }, []);

  useEffect(() => {
    if (running) {
      setLogShow(true);
    }
  }, [running]);

  const applyNow = () => {
    setRunning(true)
    apply(selectedIds, shipperSelected)
    .then(data => {

    })
    .catch(err => console.log(err.message || err))
    .finally(() => setRunning(false))
  }

  return (
    <>
      <FreeFeatureHeader
        title="Free Tools - Atur Pengiriman"
        canBack={true}
        selectedIds={selectedIds}
      />
      <Logs
        open={logShow}
        logs={logs}
        closeable={!running}
        onClose={() => {
          if (!running) {
            setLogShow(false);
          }
        }}
      />
      <div className="free-feature-set-pengiriman page">
        <div className="main">
          <div className="left-side">
            <SelectAccount onSelectedChange={(ids) => setSelectedIds(ids)} />
          </div>
          <div className="the-right-side">
            <Alert
              message="Aksi tidak dapat dibatalkan"
              type="warning"
              showIcon
            />
            
            {/* {selectedIds.length < 1 && <WrapperSelectOne />} */}
            <Typography className="main-title">Atur Pengiriman</Typography>
            <Typography className="sub-title">Pilih layanan kurir yang ingin kamu sediakan di tokomu</Typography>
            <Typography className="sub-title mt">Semua kurir pada layanan ini memiliki fitur :</Typography>
            <div className="courier-features">
              <div className="courier-feature">
                <Typography className="name">AWB Otomatis</Typography>
                <Tooltip title='Dengan fitur ini, resi pengiriman akan terupdate secara otomatis di akun Penjual dan Pembeli.'>
                  <InfoIcon className="info-icon" />
                </Tooltip>
              </div>
              <div className="courier-feature">
                <Typography className="name">Non Tunai</Typography>
                <Tooltip title='Penjual tidak perlu bayar ongkir ke kurir. Ongkir dipotong langsung dari saldo penjual saat barang sudah diterima pembeli.'>
                  <InfoIcon className="info-icon" />
                </Tooltip>
              </div>
            </div>
            <ShipperSelector
              onChange={(ids) => setShipperSelected(ids)}
            />
            <div className="actions">
              <Popconfirm
                title="Konfirmasi"
                arrow={false}
                description="Anda yakin ingin melanjutkan ?"
                showArrow={false}
                cancelText="Batal"
                okText="Terapkan"
                okButtonProps={{
                  danger: true,
                }}
                onConfirm={applyNow}
              >
                <Button type="primary" danger disabled={selectedIds.length < 1 || shipperSelected.length < 1}
                >
                  Terapkan ({selectedIds.length})
                </Button>
              </Popconfirm>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
