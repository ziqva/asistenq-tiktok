import FreeFeatureHeader from "element/FreeFeatureHeader";
import "./index.scss";
import { Input, Button } from "antd";
import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import authSync from "utils/free-feature/authenticator/sync";
import MainData from "utils/free-feature/authenticator/MainData";
import DataGrid from "./DataGrid";
import AddDialog from "./AddDialog";
import Tooltip from "@mui/material/Tooltip";

const mainData = new MainData();

export default function FreeFeatureAuthenticator() {
  const [syncLoading, setSyncLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    mainData.onData = (data) => setData(data);
    mainData.connect();
    document.title = "Free Feature | Authenticator";
  }, []);

  const sync = () => {
    setSyncLoading(true);
    authSync()
      .then(() => {
        setSyncLoading(false);
      })
      .catch((err) => {
        window.alert(err.message || err);
        setSyncLoading(false);
      });
  };

  return (
    <>
      <FreeFeatureHeader title="Free Tools - Authenticator" />
      <AddDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
      <div className="free-feature-authenticator page">
        <div className="header">
          <Input
            className="search-field"
            placeholder="Cari"
            value={search}
            onChange={(sender) => setSearch(sender.target.value)}
          />
          <div className="right">
            <Tooltip title="Sinkronisasi authenticator dengan data akun">
              <Button
                className="sync-btn"
                loading={syncLoading}
                onClick={sync}
                type="primary"
              >
                <SyncIcon className="icon" />
                <div className="text">Sync</div>
              </Button>
            </Tooltip>

            <Button
              className="add-btn"
              type="primary"
              disabled={addDialogOpen}
              onClick={() => setAddDialogOpen(true)}
            >
              <AddIcon className="icon" />
              <div className="text">Tambah</div>
            </Button>
          </div>
        </div>
        <DataGrid
          selected={selected}
          selectedCount={selected.length}
          onSelectedChange={(data) => setSelected(data)}
          onSelectedToggle={(id, target) => {
            if (target) {
              let tmp = [...selected];
              tmp.push(id);
              setSelected(tmp);
            } else {
              let tmp = [...selected];
              const i = tmp.findIndex((x) => x === id);
              if (i >= 0) {
                tmp.splice(i, 1);
                setSelected(tmp);
              }
            }
          }}
          data={data
            .filter((x) => {
              const s = search.toLowerCase();
              return (
                x.label.toLowerCase().includes(s) ||
                x.email.toLowerCase().includes(s)
              );
            })
            .map((item) => {
              return {
                selected: selected.findIndex((s) => s === item.id) >= 0,
                ...item,
              };
            })}
        />
      </div>
    </>
  );
}
