import FreeFeatureHeader from "element/FreeFeatureHeader";
import { useEffect, useState } from "react";
import "./index.scss";
import { Button, Spin, Empty, Popconfirm, Typography, Dropdown } from "antd";
import SelectAccount from "./SelectAccount";
import SetDays from "./SetDays";
import WrapperSelectOne from "./WrapperSelectOne";
import MainData from "utils/free-feature/operationalSchedule/MainData";
import Logs from "./Logs";

const md = new MainData();

export default function FreeFeatureJadwalOperasional() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [days, setDays] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [logShow, setLogShow] = useState(false);

  useEffect(() => {
    document.title = "Free Feature | Jadwal Operasional";
    md.onLogs = (logs) => setLogs(logs);
    md.onRunningState = (state) => setRunning(state);
  }, []);

  useEffect(() => {
    if (running) {
      setLogShow(true);
    }
  }, [running]);

  return (
    <>
      <FreeFeatureHeader
        title="Free Tools - Jadwal Operasional"
        canBack={true}
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
      <div className="free-feature-jadwal-operasional page">
        <div className="main">
          <div className="left-side">
            <SelectAccount onSelectedChange={(ids) => setSelectedIds(ids)} />
          </div>
          <div className="the-right-side">
            {selectedIds.length < 1 && <WrapperSelectOne />}
            <Typography className="main-title">
              Atur Jam Operasional Toko
            </Typography>
            <SetDays onChange={(days) => setDays(days)} />
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
                onConfirm={() => {
                  setLogs([]);
                  md.start(selectedIds, days);
                }}
              >
                <Button type="primary" danger disabled={selectedIds.length < 1}>
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
