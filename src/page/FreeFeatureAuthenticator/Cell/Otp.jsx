import { CopyToClipboard } from "react-copy-to-clipboard";
import Tooltip from "@mui/material/Tooltip";

export default function CellOtp({ data }) {
  console.log(data);
  return (
    <div className="cell-otp">
      <div className="otp-text" data-danger={data.otp === null}>
        <CopyToClipboard text={data.otp}>
          <Tooltip title="Salin">
            <div className="text">{data.otp}</div>
          </Tooltip>
        </CopyToClipboard>
      </div>
    </div>
  );
}
