import FreeFeatureHeader from "element/FreeFeatureHeader";
import MainData from "utils/free-feature/uploadProduct/MainData";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import getAccount from "utils/free-feature/uploadProduct/getAccount";
import "./index.scss";
import Account from "./Account";
import SelectFolder from "./SelectFolder";
import { Input, Button } from "antd";
import ActionOnFinish from "./ActionOnFinish";
import UploadIcon from "@mui/icons-material/Upload";
import upload from "utils/free-feature/uploadProduct/upload";
import stop from "utils/free-feature/uploadProduct/stop";
import Setting from "utils/Setting";

const setting = new Setting();

export default function FreeFeatureUploadProduct() {
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [account, setAccount] = useState(undefined);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [maxFile, setMaxFile] = useState("");
  const [actionOnChange, setActionOnChange] = useState("move");
  const [actionOnChangeFetched, setActionOnChangeFetched] = useState(false);
  const [disabledBtn, setDisabledBtn] = useState(false);
  const [maxFileFetched, setMaxFileFetched] = useState(false);
  const params = useParams();

  useEffect(() => {
    if (actionOnChangeFetched) {
      setting.set("product_upload_onchange", actionOnChange);
    }
  }, [actionOnChange, actionOnChangeFetched]);

  useEffect(() => {
    if (maxFileFetched) {
      setting.set(
        "product_upload_maxfile",
        isNaN(parseInt(maxFile)) ? 1 : parseInt(maxFile)
      );
    }
  }, [maxFile, maxFileFetched]);

  useEffect(() => {
    setting
      .get("product_upload_maxfile")
      .then((val) => {
        setMaxFile(val);
        setMaxFileFetched(true);
      })
      .catch((err) => {
        setMaxFileFetched(true);
      });

    setting
      .get("product_upload_onchange")
      .then((val) => {
        setActionOnChange(val);
        setActionOnChangeFetched(true);
      })
      .catch((err) => {
        setActionOnChangeFetched(true);
      });
  }, []);

  const handleUpload = () => {
    if (uploading) {
      stop();
    } else {
      upload({
        id: params.id,
        maxFile,
        afterUploaded: actionOnChange,
        dirPath: selectedFolder,
      })
        .then(() => {})
        .catch((err) => console.error(err.message || err));
    }
  };

  useEffect(() => {
    if (uploading) {
      setDisabledBtn(false);
    } else {
      if (selectedFolder === null) {
        setDisabledBtn(true);
      } else if (isNaN(parseInt(maxFile))) {
        setDisabledBtn(true);
      } else {
        setDisabledBtn(false);
      }
    }
  }, [uploading, selectedFolder, maxFile]);

  useEffect(() => {
    const md = new MainData();
    md.onUploading = (state) => setUploading(state);
    md.onLogs = (logs) => setLogs(logs);
    getAccount(params.id)
      .then((data) => setAccount(data))
      .catch((err) => {
        console.error(err);
      });
    document.title = "Free Feature | Upload Product";
  }, []);

  return (
    <>
      <FreeFeatureHeader
        title="Free Tools - Product Uploader"
        canBack={!uploading}
      />
      <div className="free-feature-product-uploader page">
        <div className="left-side">
          {account && <Account data={account} />}
          <SelectFolder
            selectedFolder={selectedFolder}
            onSelectedFolderChange={(folder) => setSelectedFolder(folder)}
          />
          <Input
            placeholder="Max file"
            value={maxFile}
            className="max-file-field"
            type="number"
            onChange={(sender) => setMaxFile(sender.target.value)}
          />
          <ActionOnFinish
            state={actionOnChange}
            onStateChange={(state) => setActionOnChange(state)}
          />
          <Button
            type="dashed"
            danger={uploading}
            disabled={disabledBtn}
            className="upload-btn"
            onClick={handleUpload}
            icon={<UploadIcon />}
          >
            {uploading ? "Batal" : "Upload"}
          </Button>
        </div>
        <div className="main">
          <div className="logs">
            {logs.map((log, i) => (
              <div className="log" key={i}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
