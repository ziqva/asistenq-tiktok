import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "antd";
import selectFolder from "utils/free-feature/uploadProduct/selectFolder";
import Tooltip from "@mui/material/Tooltip";
import getCurrentSelectedFolder from "utils/free-feature/uploadProduct/getCurrentSelectedFolder";
import { useEffect } from "react";

export default function SelectFolder({
  selectedFolder,
  onSelectedFolderChange,
}) {
  useEffect(() => {
    getCurrentSelectedFolder()
      .then((data) => {
        onSelectedFolderChange(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    <div className="select-folder-container">
      <div className="folder-container" data-danger={selectedFolder === null}>
        <div className="icon-container" data-danger={selectedFolder === null}>
          {selectedFolder !== null ? (
            <CheckIcon className="icon" />
          ) : (
            <CloseIcon className="icon" />
          )}
        </div>
      </div>
      <Tooltip title={selectedFolder}>
        <div className="name">
          {selectedFolder !== null ? selectedFolder : "Belum memilih folder"}
        </div>
      </Tooltip>
      <Button
        className="select-folder-btn"
        size="small"
        onClick={() => {
          selectFolder()
            .then((folder) => {
              onSelectedFolderChange(folder);
            })
            .catch((err) => {
              onSelectedFolderChange(null);
            });
        }}
      >
        Pilih folder
      </Button>
    </div>
  );
}
