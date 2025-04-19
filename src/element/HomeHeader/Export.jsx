import { Button, Dropdown } from "antd";
import SaveIcon from "@mui/icons-material/Save";
import { useState } from "react";
import accountExport from "utils/main/account/exports";

export default function Export({ selectedAccounts, useSelection, ...args }) {
  const [loading, setLoading] = useState(false);
  const menu = {
    items: [
      {
        label: "Semua",
        key: "all",
        disabled: loading,
      },
      {
        label: "Semua (Dengan tanggal moderasi)",
        key: "all_with_moderation_date",
        disabled: loading
      },
      {
        label: "Sudah Login",
        key: "authenticated",
        disabled: loading,
      },
      {
        label: "Belum Login",
        key: "unauthenticated",
        disabled: loading,
      },
      {
        label: "Moderasi",
        key: "moderated",
        disabled: loading,
      },
      {
        label: `Terpilih (${selectedAccounts.length})`,
        key: "selected",
        disabled: loading || !useSelection,
      },
    ],
    onClick: (params) => {
      setLoading(true);
      accountExport({ type: params.key, selected: selectedAccounts || [] })
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          window.alert(err.message || err);
          setLoading(false);
        });
    },
  };

  return (
    <div className="export-header-element" {...args}>
      <Dropdown menu={menu} disabled={loading}>
        <Button
          disabled={loading}
          type="dashed"
          className="btn"
          loading={loading}
        >
          <SaveIcon />
          <div className="text">Export</div>
        </Button>
      </Dropdown>
    </div>
  );
}
