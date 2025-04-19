import MainCellCounter from "element/MainCellCounter"
import formatRupiah from "utils/main/formatRupiah"

export default function Complaint({data, onClick}) {
    return data?.complaintCount > 0 && (
        <div className="complaint-cell" onClick={() => onClick(data.id)}>
            <MainCellCounter
                count={data.complaintCount}
                green={true}
            />
            <div className="potency">{formatRupiah(data.complaintPotency)}</div>
        </div>
    )
}