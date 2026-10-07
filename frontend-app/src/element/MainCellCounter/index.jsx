import './main-cell-counter.scss'

export default function MainCellCounter({green, red, orange, count}) {
    return (
        <div className="main-cell-counter element"
            data-red={red}
            data-green={green}
            data-orange={orange}
        >
            {count}
        </div>
    )
}