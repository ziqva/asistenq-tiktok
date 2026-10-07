export default function Skor({data, onClick}) {
    return data?.score > 0 && (
        <div 
            className="skor-cell"
            data-red={data.score < 60}
            onClick={() => onClick(data.id)}>
                {data.score}
        </div>
    )
}