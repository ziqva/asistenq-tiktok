import MainCellCounter from "element/MainCellCounter";
import moment from "moment-timezone";
import "moment/locale/id";
import formatRupiah from "utils/main/formatRupiah";
import { useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";

export default function Dikemas({ data, onClick }) {
  const [type, setType] = useState("");

  useEffect(() => {
    if (data.dikemasCount > 0) {
      const current = moment().tz("Asia/Jakarta").unix();
      const epoch = data.dikemasEpoch;
      let r = current > epoch ? current - epoch : epoch - current;
      if (r < 86400) {
        setType("red");
      } else if (r >= 86400 && r <= 172800) {
        setType("orange");
      } else {
        setType("green");
      }
    }
  }, [data]);

  return (
    data.dikemasCount > 0 && (
      <div
        className="dikemas-cell"
        data-epoch={data.dikemasEpoch}
        onClick={() => onClick(data.id)}
      >
        <Tooltip
          title={moment(data.dikemasEpoch * 1000)
            .tz("Asia/Jakarta")
            .format("D MMM HH.mm")}
        >
            <MainCellCounter
              red={type === "red"}
              orange={type === "orange"}
              green={type === "green"}
              count={data.dikemasCount}
            />
            <div className="ago">
              {moment(data.dikemasEpoch * 1000)
                .tz("Asia/Jakarta")
                .fromNow()
                .replace("dalam", "")
                .replace("yang lalu", "")
                .trim()}
            </div>
            <div className="potency">{formatRupiah(data.dikemasPotency)}</div>
        </Tooltip>
      </div>
    )
  );
}
