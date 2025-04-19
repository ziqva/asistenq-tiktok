import MainCellCounter from "element/MainCellCounter"
import formatRupiah from "utils/main/formatRupiah"

export default function Dikirim({data, onClick}) {
    return data.dikirimCount > 0 && (
        <div className="dikirim-cell" onClick={() => onClick(data.id)}>
            <MainCellCounter
                green={true}
                count={data.dikirimCount}
            />
            <div className="potency">
                {formatRupiah(data.dikirimPotency)}
            </div>
        </div>
    )
}