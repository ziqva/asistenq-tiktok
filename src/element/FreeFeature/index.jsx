import { Button, Dropdown } from "antd";
import MenuIcon from "@mui/icons-material/Menu";
import AuthenticatorIcon from "@mui/icons-material/QrCode2";
import ChatIcon from "@mui/icons-material/Chat";
import "./index.scss";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LuggageIcon from "@mui/icons-material/Luggage";
import DrawIcon from "@mui/icons-material/Draw";
import { useEffect, useState } from "react";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

const MenuItem = ({ text, icon, url, onClick, disabled }) => {
  return (
    <div
      className="free-feature-menu-icon"
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          window.open(url, "_blank");
        }
      }}
    >
      {icon}
      <div className="text">{text}</div>
    </div>
  );
};

export default function FreeFeature({ selectedIds, ...args }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems([
      {
        key: 1,
        label: (
          <MenuItem
            text="Authenticator"
            icon={<AuthenticatorIcon className="icon" />}
            url="/free-feature/authenticator"
          />
        ),
      },
      {
        key: 2,
        label: (
          <MenuItem
            text="Template Chat"
            icon={<ChatIcon className="icon" />}
            url="/free-feature/template-chat"
          />
        ),
      },
      {
        key: 3,
        label: (
          <MenuItem
            text="Jadwal Operasional"
            url="/free-feature/jadwal-operasional"
            icon={<CalendarMonthIcon className="icon" />}
          />
        ),
      },
      {
        key: 4,
        label: (
          <MenuItem
            text="Atur Tanggal Libur"
            url="/free-feature/atur-tanggal-libur"
            icon={<LuggageIcon />}
          />
        ),
      },
      {
        key: 5,
        label: (
          <MenuItem
            text="Atur Slogan"
            url="/free-feature/atur-slogan"
            icon={<DrawIcon />}
          />
        ),
      },
      {
        key: 6,
        label: (
          <MenuItem
            text={`Atur Foto Profil`}
            icon={<InsertPhotoIcon />}
            url="/free-feature/atur-foto-profil"
          />
        ),
      },
      {
        key: 7,
        label: (
          <MenuItem
            text={`Atur Pengiriman`}
            icon={<LocalShippingIcon />}
            url="/free-feature/atur-pengiriman"
          />
        ),
      },
    ]);
  }, [selectedIds]);

  return (
    <div className="free-feature element" {...args}>
      <Dropdown menu={{ items }}>
        <Button className="btn-toggle" type="link">
          <MenuIcon className="icon" />
          <div className="text">Free Feature</div>
        </Button>
      </Dropdown>
    </div>
  );
}
