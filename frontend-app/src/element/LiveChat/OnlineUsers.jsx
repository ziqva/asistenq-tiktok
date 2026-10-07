import {
    Avatar
} from 'antd'
import Tooltip from '@mui/material/Tooltip'

export default function OnlineUsers({data}) {
    return (
        <div className="online-users">
            <Avatar.Group
                maxCount={7}
            >
                {data.map((user, index) =>  (
                    <Tooltip title={user.name} key={index}>
                        <Avatar
                            key={index}
                            alt={user.name}
                            src={user.avatar}
                            className='online-user-item'
                        />
                    </Tooltip>
                ))}
            </Avatar.Group>            
        </div>
    )
}