import MainCellCounter from "element/MainCellCounter";
import moment from "moment-timezone";
import "moment/locale/id";
import formatRupiah from "utils/main/formatRupiah";
import { useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";

export default function NewOrder({ data, onClick }) {
  const [type, setType] = useState("");

  useEffect(() => {
    if (data?.orderCount > 0) {
      const current = moment().tz("Asia/Jakarta").unix();
      let r = current - data.orderEpoch;
      r = r - r - r;
      if (r < 36000) {
        setType("red");
      } else if (r > 36000 && r < 72000) {
        setType("orange");
      } else {
        setType("green");
      }
    }
  }, [data]);

  return (
    data?.orderCount > 0 && (
      <Tooltip
        title={moment(data.orderEpoch * 1000)
          .tz("Asia/Jakarta")
          .format("D MMM HH.mm")}
      >
        <div className="new-order-cell" onClick={() => onClick(data.id)}>
          <MainCellCounter
            green={type === "green"}
            red={type === "red"}
            orange={type === "orange"}
            count={data.orderCount}
          />
          <div className="ago">
            {moment(data.orderEpoch * 1000)
              .tz("Asia/Jakarta")
              .fromNow()
              .replace("yang lalu", "")
              .replace("dalam", "")
              .trim()}
          </div>
          <div className="potency">{formatRupiah(data.orderPotency)}</div>
        </div>
      </Tooltip>
    )
  );
}
