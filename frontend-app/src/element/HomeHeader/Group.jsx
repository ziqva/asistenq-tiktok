import { Button, Switch, Checkbox, Popconfirm, Input, Space } from "antd";
import Groups3Icon from "@mui/icons-material/Groups3";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import getData from "utils/group/getData";
import groupSetActiveForAll from "utils/group/setActiveForAll";
import groupSetActive from "utils/group/setActive";
import RemoveIcon from "@mui/icons-material/Delete";
import groupRemove from "utils/group/remove";
import AddIcon from "@mui/icons-material/Add";
import groupAdd from "utils/group/add";
import CreateIcon from "@mui/icons-material/Create";
import groupUpdateSingle from "utils/group/updateSingle";

export default function Group({ ...args }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group-header-element" {...args}>
      <GroupDialog open={open} onClose={() => setOpen(false)} />
      <Button
        className="group-btn"
        disabled={open}
        onClick={() => setOpen((x) => !x)}
      >
        <Groups3Icon className="icon" />
        <div className="text">Group</div>
      </Button>
    </div>
  );
}

function GroupDialog({ open, onClose }) {
  const [groups, setGroups] = useState([]);
  const [activeForAll, setActiveForAll] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [editableGroupId, setEditableGroupId] = useState(-1);
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [editGroupValue, setEditGroupValue] = useState("");

  useEffect(() => {
    setEditGroupValue("");
  }, [editableGroupId, open]);

  useEffect(() => {
    setEditableGroupId(-1);
  }, [open]);

  const getGroupData = () => {
    setEditGroupLoading(false);
    setEditableGroupId(-1);
    getData()
      .then((data) => {
        setGroups(data.groups);
        setActiveForAll(data.activeForAll);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (open) {
      getGroupData();
    } else {
      setGroups([]);
      setActiveForAll(false);
    }
  }, [open]);

  const handleUpdateGroup = () => {
    setEditGroupLoading(true);
    const groupBefore = groups[editableGroupId].name;
    const groupAfter = editGroupValue.trim();
    groupUpdateSingle(groupBefore, groupAfter)
      .then(() => {
        setEditableGroupId(-1);
        const i = [...groups].findIndex((x) => x.name === groupBefore);
        if (i >= 0) {
          let x = [...groups];
          x[i].name = groupAfter;
          setGroups(x);
        }
      })
      .catch((err) => {})
      .finally(() => {
        setEditGroupLoading(false);
      });
  };

  return (
    <Dialog open={open} onClose={onClose} className="group-dialog">
      <DialogTitle className="title">
        <div className="left">
          <Groups3Icon className="icon" />
          <div className="text">Group</div>
        </div>
        <div className="right">
          <Checkbox
            checked={activeForAll}
            onChange={(sender) => {
              groupSetActiveForAll(sender.target.checked, () => {
                setActiveForAll(sender.target.checked);
              }).catch((err) => console.error(err.message || err));
            }}
          >
            All
          </Checkbox>
        </div>
      </DialogTitle>
      <DialogContent style={{ width: "300px" }}>
        <Space.Compact className="group-add-header">
          <Input
            placeholder="Nama Group"
            value={groupName}
            onChange={(sender) => setGroupName(sender.target.value)}
          />
          <Button
            icon={<AddIcon />}
            onClick={() =>
              groupAdd(groupName.trim())
                .catch((err) => {
                  console.error(err.message || err);
                })
                .then(() => {
                  getGroupData();
                  setGroupName("");
                })
            }
            disabled={
              groupName.trim().length < 1 ||
              groups.findIndex((x) => x.name === groupName.trim()) >= 0
            }
          />
        </Space.Compact>
        <div className="group-list">
          {groups.map((group, index) => (
            <div className="group" key={index}>
              <div className="name">
                {editableGroupId === index && (
                  <input
                    defaultValue={group.name}
                    autoFocus
                    onChange={(sender) =>
                      setEditGroupValue(sender.target.value)
                    }
                    disabled={editGroupLoading}
                    onKeyUp={(sender) => {
                      if (sender.keyCode === 13) {
                        handleUpdateGroup();
                      }
                    }}
                  />
                )}
                {editableGroupId !== index && group.name}
              </div>
              <div className="right">
                {!editGroupLoading && (
                  <div
                    className="action edit"
                    onClick={() => setEditableGroupId(index)}
                  >
                    <CreateIcon className="icon" />
                  </div>
                )}
                <div className="action delete">
                  <Popconfirm
                    title="Hapus"
                    description={
                      <>
                        Group <b>{group.name}</b> akan dihapus juga pada seluruh
                        akun secara permanen apakah anda yakin ingin melanjutkan
                        ?
                      </>
                    }
                    overlayStyle={{ zIndex: 10000, maxWidth: 250 }}
                    style={{ zIndex: 10000 }}
                    overlayInnerStyle={{ zIndex: 10000 }}
                    onConfirm={() => {
                      return groupRemove(group.name)
                        .then(() => {
                          getGroupData();
                        })
                        .catch((err) => {
                          console.error(err);
                        });
                    }}
                  >
                    <RemoveIcon className="icon" />
                  </Popconfirm>
                </div>
                <div className="count">({group.count})</div>
                <Switch
                  defaultChecked={group.active}
                  size="small"
                  disabled={activeForAll}
                  onChange={(sender) => {
                    groupSetActive(group.name, sender, () => {}).catch((err) =>
                      console.error(err.message || err)
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          className="close-actions"
          size="small"
          danger
          type="primary"
          onClick={onClose}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
