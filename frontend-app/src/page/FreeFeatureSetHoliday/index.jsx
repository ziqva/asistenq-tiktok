import FreeFeatureHeader from "element/FreeFeatureHeader";
import { useEffect, useState } from "react";
import "./index.scss";
import { Button, Spin, Empty, Popconfirm, Typography, Dropdown } from "antd";
import SelectAccount from "./SelectAccount";
import SetDays from "./SetDays";
import WrapperSelectOne from "./WrapperSelectOne";
import MainData from "utils/free-feature/holiday/MainData";
import Logs from "./Logs";
import Range from "./Range";
import InfoIcon from "@mui/icons-material/InfoRounded";

const md = new MainData();

export default function FreeFeatureSetHoliday() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [logShow, setLogShow] = useState(false);
  const [range, setRange] = useState([0, 0]);

  useEffect(() => {
    document.title = "Free Feature | Atur Tanggal Libur";
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
        title="Free Tools - Atur Tanggal Libur"
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
      <div className="free-feature-set-holiday page">
        <div className="main">
          <div className="left-side">
            <SelectAccount onSelectedChange={(ids) => setSelectedIds(ids)} />
          </div>
          <div className="the-right-side">
            {selectedIds.length < 1 && <WrapperSelectOne />}
            <Typography className="main-title">Atur Tanggal Libur</Typography>
            <Range onChange={([from, to]) => setRange([from, to])} />
            <div className="actions">
              <Button
                type="primary"
                disabled={selectedIds.length < 1}
                onClick={() => {
                  setLogs([]);
                  md.unset(selectedIds);
                }}
              >
                Buka Toko
              </Button>
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
                  md.start(selectedIds, {
                    from: range[0].format("DD-MM-YYYY"),
                    to: range[1].format("DD-MM-YYYY"),
                  });
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
