import formatRupiah from "utils/main/formatRupiah";
import Tooltip from "@mui/material/Tooltip";
import { popoverClasses } from "@mui/material";

const getColor = (totalProduct, limit) => {
  const sisa = limit - totalProduct
  if(sisa < 1) {
    return {
      background: "var(--red-tokped-bg)",
      color: "var(--red-tokped-color)"
    }
  }
  if(sisa <= 100) {
    return {
      background: "var(--orange-tokped-bg)",
      color: "var(--orange-tokped-color)"
    }
  }
  return {
    backgorund: "var(--green-tokped-bg)",
    color: "var(--green-tokped-color)"
  }
}

export default function Product({ data, onClick }) {
  return (
    <div className="product-cell" onClick={() => onClick(data.id)}>
      <Tooltip
        title={
          <table className="product-popup">
            <tbody className="list">
              <tr className="item">
                <th className="name">Semua Product: </th>
                <th className="value">{data.productCount}</th>
              </tr>
              <tr className="item">
                <th className="name">Limit Product: </th>
                <th className="value">{data.productSpace}</th>
              </tr>
              <tr className="item">
                <th className="name">Aktif: </th>
                <th className="value">{data.activeProduct}</th>
              </tr>
              <tr className="item">
                <th className="name">Nonaktif: </th>
                <th className="value">{data.inactiveProduct}</th>
              </tr>
              <tr className="item">
                <th className="name">Pelanggaran: </th>
                <th className="value">{data.violationProduct}</th>
              </tr>
              <tr className="item">
                <th className="name">Diarsipkan:</th>
                <th className="value">{data.archivedProduct}</th>
              </tr>
            </tbody>
          </table>
        }
      >
        <div className="text-container" style={{
          color: getColor(data.productCount, data.productSpace).color,
          background: getColor(data.productCount, data.productSpace).background
        }}>
          {formatRupiah(data.productCount).replace("Rp", "").trim()} / {formatRupiah(data.productSpace).replace('Rp', '').trim()}
        </div>
      </Tooltip>
    </div>
  );
}
