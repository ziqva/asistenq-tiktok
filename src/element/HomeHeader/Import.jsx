import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
} from "@mui/material";
import BackupIcon from "@mui/icons-material/Backup";
import DownloadIcon from "@mui/icons-material/Download";
import { useEffect, useState } from "react";
import { Button } from "antd";
import importAccount from "utils/importAccount";

export default function Import({ ...args }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="import-header-element" {...args}>
      <Button className="btn" type="primary" onClick={() => setOpen((x) => !x)}>
        <BackupIcon /> <div className="text">Import</div>
      </Button>
      <ImportDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

const ImportDialog = ({ open, onClose }) => {
  const [file, setFile] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const process = () => {
    setLoading(true);
    importAccount(file)
      .then(() => {
        onClose();
        setFile(undefined);
        setLoading(false);
      })
      .catch((err) => {
        window.alert(err.message || err);
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle style={{ fontSize: 15 }}>Import Akun</DialogTitle>
      <DialogContent>
        <div className="import-dialog-sections">
          <div className="import-dialog-section download-template">
            <div className="number">
              <div className="text">1</div>
            </div>
            <div className="content">
              <p>Silahkan download template terlebih dahulu</p>
              <Button
                type="primary"
                className="dn-btn"
                icon={<DownloadIcon />}
                disabled={loading}
                onClick={() => {
                  window.location.href =
                    "http://ziqva-resource.streampeg.com/asistenq-tiktok-import-template.xlsx";
                }}
              >
                template.xlsx
              </Button>
            </div>
          </div>
          <div className="import-dialog-section upload-template">
            <div className="number">
              <div className="text">2</div>
            </div>
            <div className="content">
              <p>Pilih file yang sudah anda sunting</p>
              <input
                type="file"
                disabled={loading}
                onChange={(sender) =>
                  setFile(
                    sender.target.files.length < 1
                      ? undefined
                      : sender.target.files[0]
                  )
                }
                accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              />
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button type="dashed" onClick={onClose} disbled={loading}>
          Batal
        </Button>
        <Button disabled={!file || loading} type="primary" onClick={process}>
          Proses
        </Button>
      </DialogActions>
    </Dialog>
  );
};
