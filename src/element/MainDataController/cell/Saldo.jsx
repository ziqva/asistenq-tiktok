import formatRupiah from "utils/main/formatRupiah"

export default function Saldo({data, onClick}) {
    return data?.balance > 0 && (
        <div className="saldo-cell" onClick={() => onClick(data.id)}>
            <div className="balance"
                data-is-red={data.balance<50000}
                data-is-orange={data.balance>50000&&data.balance<1000000}
                data-is-green={data.balance>=1000000}
            >{formatRupiah(data.balance)}</div>
        </div>
    )
}