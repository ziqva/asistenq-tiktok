export default function CellAccount({data}) {
    return (
        <div className="cell-account">
            <div className="email">{data.email}</div>
            <div className="name">{data.label}</div>
        </div>
    )
}