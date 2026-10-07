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
import Item from "./Item";
import axios from "axios";
import server from "config/server";

const md = new MainData();

export default function FreeFeatureSetSlogan() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [logShow, setLogShow] = useState(false);
  const [data, setData] = useState({ slogans: [], descriptions: [] });

  const fetchData = () => {
    const url = `${server.api.base}/slogan/detail`;
    axios
      .get(url)
      .then(({ data }) => {
        if (data.error) {
          console.error(data.msg);
        } else {
          setData(data.data);
        }
      })
      .catch((err) => console.error(err.message || err));
  };

  useEffect(() => {
    document.title = "Free Feature | Slogan";
    md.onLogs = (logs) => setLogs(logs);
    md.onRunningState = (state) => setRunning(state);
    fetchData();
  }, []);

  useEffect(() => {
    if (running) {
      setLogShow(true);
    }
  }, [running]);

  return (
    <>
      <FreeFeatureHeader title="Free Tools - Atur Slogan" canBack={true} selectedIds={selectedIds} />
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
      <div className="free-feature-set-slogan page">
        <div className="main">
          <div className="left-side">
            <SelectAccount onSelectedChange={(ids) => setSelectedIds(ids)} />
          </div>
          <div className="the-right-side">
            {(data.slogans.length < 1 || data.descriptions.length < 1) && (
              <Alert
                message='Jika tidak ada list data maka akan tersimpan kosong ("")'
                type="warning"
                showIcon
              />
            )}
            <Alert
              message="Akan disetting secara acak dengan data yang ada di list untuk diterapkan di masing masing akun"
              type="info"
              showIcon
            />
            {selectedIds.length < 1 && <WrapperSelectOne />}
            <Typography className="main-title">Atur Slogan</Typography>
            <Item
              onChange={fetchData}
              title="Slogan"
              min={1}
              data={data.slogans}
              error={data.slogans.length < 1}
              max={48}
              name="slogans"
            />
            <Item
              title="Deskripsi"
              onChange={fetchData}
              min={1}
              data={data.descriptions}
              error={data.descriptions.length < 1}
              max={140}
              name="descriptions"
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
                onConfirm={() => {
                  setLogs([]);
                  md.start(selectedIds, {
                    descriptions: data.descriptions,
                    slogans: data.slogans,
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
