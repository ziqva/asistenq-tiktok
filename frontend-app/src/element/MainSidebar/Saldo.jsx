import { useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import formatRupiah from "utils/main/formatRupiah";

export default function Saldo({ count, active, data }) {
  const [showSaldo, setShowSaldo] = useState(true);
  const [detailText, setDetailText] = useState("Total Saldo");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    switch (active) {
      case "active":
        setBalance(data.mainSaldo);
        setDetailText("Total Saldo (aktif)");
        break;
      case "order":
        setBalance(data.newOrderPotency);
        setDetailText("Potensi Orderan");
        break;
      case "packing":
        setBalance(data.dikemasPotency);
        setDetailText("Potensi Dikemas");
        break;
      case "shipping":
        setBalance(data.dikirimPotency);
        setDetailText("Potensi Dikirim");
        break;
      case "complaint":
        setBalance(data.complaintPotency);
        setDetailText("Potensi Komplain");
        break;
      case "loggedin":
        setBalance(data.activeSaldo);
        setDetailText("Total Saldo");
        break;
      case "moderasi":
        setBalance(data.moderatedSaldo);
        setDetailText("Total Saldo");
        break;
      default:
        setBalance(data.saldo);
        setDetailText("Total Saldo");
    }
  }, [active, data]);

  return (
    <div className="saldo-container" data-aos="fade-up" data-aos-delay={800}>
      <Tooltip title={showSaldo ? formatRupiah(balance) : ""}>
        <div className="text">
          <div className="detail-text">{detailText}</div>
          <div
            className="count"
            onClick={() => {
              setShowSaldo((x) => !x);
            }}
          >
            {showSaldo ? formatRupiah(balance) : "*****"}
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
