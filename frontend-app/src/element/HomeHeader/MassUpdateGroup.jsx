import { Button, Input, Select } from "antd";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import massUpdate from "utils/group/massUpdate";
import server from "config/server";
import axios from "axios";

export default function MassUpdateGroup({ selecteds, useSelection }) {
  const [open, setOpen] = useState(false);
  const [groups, setgroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    if (open) {
      const url = `${server.api.base}/group/data`;
      axios
        .get(url)
        .then(({ data }) => {
          if (data.error) {
            console.error(data.msg);
          } else {
            setgroups(data.groups);
          }
        })
        .catch((err) => console.error(err.message || err));
    }
  }, [open]);

  return (
    useSelection && (
      <div className="mass-update-group-header-element">
        <Button
          className="mass-update-open-btn-toggle"
          disabled={selecteds.length < 1 || open}
          onClick={() => setOpen(true)}
        >
          <EditIcon className="icon" />
          <div className="text">Ubah Group</div>
        </Button>
        <MassUpdateDialog
          open={open}
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
          onClose={() => setOpen(false)}
          selecteds={selecteds}
          groups={groups}
          setGroups={setgroups}
        />
      </div>
    )
  );
}

function MassUpdateDialog({
  open,
  onClose,
  selecteds,
  selectedGroups,
  setSelectedGroups,
  groups,
  setGroups,
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedGroups([]);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="mass-update-dialog-element"
    >
      <DialogTitle className="mass-update-title">
        <EditIcon className="icon" />
        <div className="text">Ubah Group</div>
      </DialogTitle>
      <DialogContent className="content">
        <div className="description">
          Ubah group secara massal pada <b>{selecteds.length} akun</b> secara
          menimpa grub yang sudah diset pada akun sebelumnya
        </div>
        {/* <Input
          placeholder="Group (pisahkan dengan koma)"
          disabled={loading}
          value={groups}
          onChange={(sender) => setGroups(sender.target.value)}
        /> */}
        <Select
          mode="multiple"
          placeholder="Groups"
          style={{ width: "100%" }}
          options={groups.map((group) => {
            return {
              name: group.name,
              value: group.name,
            };
          })}
          value={selectedGroups}
          onChange={(sender) => {
            setSelectedGroups(sender);
          }}
          maxTagCount={6}
          dropdownStyle={{
            zIndex: 10000,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button type="primary" disabled={loading} danger onClick={onClose}>
          Batal
        </Button>
        <Button
          type="primary"
          disabled={loading}
          loading={loading}
          onClick={(sender) => {
            setLoading(true);
            massUpdate({ ids: selecteds, groupNames: selectedGroups.join(",") })
              .then(() => {
                setLoading(false);
                setSelectedGroups([]);
                onClose();
              })
              .catch((err) => {
                window.alert(err.message || err);
                setLoading(false);
              });
          }}
        >
          Ubah
        </Button>
      </DialogActions>
    </Dialog>
  );
}
