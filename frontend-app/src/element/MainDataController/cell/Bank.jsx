export default function Bank({data, onClick}) {
    return (
        <div className="bank-cell" onClick={() => onClick(data.id)}>
            <div className="bank-container">
                <div className="name">{data.bankName}</div>
                <div className="number">{data.bankNumber}</div>
                <div className="an">{data.bankAN}</div>
            </div>
        </div>
    )
}