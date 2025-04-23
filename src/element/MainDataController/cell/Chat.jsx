import MainCellCounter from "element/MainCellCounter"
// import moment from 'moment-timezone'
import 'moment/locale/id'

export default function Chat({data, onClick}) {
    return data.chatCount > 0 && (
        <div className="chat cell" onClick={() => onClick(data.id)}>
            <MainCellCounter
                count={data.chatCount}
                green={data.chatCount < 4}
                orange={data.chatCount >= 5 && data.chatCount < 10}
                red={data.chatCount >= 10}
            />
            {/* <div className="ago">
                {moment(data.lastChatEpoch)
                .tz('Asia/Jakarta')
                .fromNow()
                .replace('yang lalu', '')}
            </div> */}
        </div>
    )
}