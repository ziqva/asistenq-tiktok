import MainCellCounter from "element/MainCellCounter"

export default function Discus({data, onClick}) {
    return data?.discusCount > 0 && (
        <div className="discus-cell" onClick={() => onClick(data.id)}>
            <MainCellCounter
                green={true}
                count={data.discusCount}
            />
        </div>
    )
}