import { IconButton, Menu, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import SortIcon from "@mui/icons-material/Sort";
import Setting from "utils/Setting";

const setting = new Setting();

const types = [
  {
    name: "Jumlah",
    value: "jumlah",
  },
  {
    name: "Waktu",
    value: "time",
  },
  {
    name: "Nominal",
    value: "nominal",
  },
  {
    name: "Badge",
    value: "badge",
  },
];

export default function SortType({ onSortTypeChange, ...args }) {
  const [open, setOpen] = useState(null);
  const openToggle = (sender) => setOpen(sender.currentTarget);
  const [selected, setSelected] = useState(types[0].value);

  useEffect(() => {
    onSortTypeChange && onSortTypeChange(selected);
  }, [selected]);

  useEffect(() => {
    setting
      .get("sortType")
      .then((value) => {
        setSelected(value);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="home-header-sort-type" {...args}>
      <IconButton size="small" onClick={openToggle} disabled={open !== null}>
        <SortIcon />
      </IconButton>
      <Menu open={open} anchorEl={open} onClose={() => setOpen(null)}>
        {types.map((type, index) => (
          <MenuItem
            key={index}
            disabled={selected === type.value}
            onClick={() => {
              setSelected(type.value);
              setOpen(null);
              setting.set("sortType", type.value);
            }}
          >
            {type.name}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
