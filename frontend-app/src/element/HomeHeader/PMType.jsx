import { Button, Switch, Checkbox } from "antd";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import getData from "utils/pmType/getData";
import _setActiveForAll from "utils/pmType/setActiveForAll";
import setActive from "utils/pmType/setActive";

export default function PMType({ ...args }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pm-type-container" {...args}>
      <FormDialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
      <Button
        className="filter-pm-toggle-dialog-btn"
        style={{ color: "var(--main-color)" }}
        disabled={open}
        onClick={() => {
          setOpen(true);
        }}
      >
        <StorefrontIcon className="icon" />
        <div className="text">Filter PM</div>
      </Button>
    </div>
  );
}

function FormDialog({ open, onClose }) {
  const [activeForAll, setActiveForAll] = useState(false);
  const [types, setTypes] = useState([]);

  const fetchData = () => {
    getData()
      .then((data) => {
        setTypes(data.types);
        setActiveForAll(data.activeForAll);
      })
      .catch((err) => console.error(err.message || err));
  };

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setTypes([]);
      setActiveForAll(true);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      className="form-dialog-filter-pm-type"
      onClose={onClose}
    >
      <DialogTitle className="form-title">
        <StorefrontIcon className="icon" />
        <div className="title">Filter PM</div>
      </DialogTitle>
      <DialogContent>
        <Checkbox
          checked={activeForAll}
          className="all-checkbox"
          onChange={(sender) => {
            _setActiveForAll(sender.target.checked, () => {
              fetchData();
            });
          }}
        >
          All
        </Checkbox>
        <div className="types">
          {types.map((type, index) => (
            <div className="type" key={index}>
              <div className="name">{type.name}</div>
              <div className="count-container">
                <div className="count">{type.count}</div>
              </div>
              <Switch
                disabled={activeForAll}
                checked={type.active}
                size="small"
                className="active-item-type-toggle"
                onChange={(sender) => {
                  setActive(type.name, sender, () => {
                    fetchData();
                  });
                }}
              />
            </div>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <Button danger type="primary" onClick={onClose}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
