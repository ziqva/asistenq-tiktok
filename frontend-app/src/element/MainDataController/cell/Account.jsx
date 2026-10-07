import moment from 'moment-timezone'  
import 'moment/locale/id'
import OpenIcon from '@mui/icons-material/OpenInBrowser'
import PushPinIcon from '@mui/icons-material/PushPin';
import { Tooltip } from '@mui/material';

export default function Account({data, onClick, active}) {
    return (
        <div className="account cell" onClick={() => onClick(data.id)} data-active={active}>
            <Avatar
                source={data.avatar}
                active={active}
            />
            <div className="right">
                <div className="top">
                    <div className="name">{data.name}</div>
                    {data.location !== '' && <div className="location">{data.location}</div>}
                    {data.pinned === 1 && (
                        <Tooltip title='Pinned'>
                            <PushPinIcon className='pin-icon' />
                        </Tooltip>
                    )}
                </div>
                <div className="bottom">
                    <img 
                        src={data.badgeImage} 
                        alt="" 
                        className="badge-img" />
                    <div className="updated">
                        {moment(data.lastUpdated * 1000)
                            .tz("Asia/Jakarta")
                            .fromNow()
                            .split('yang lalu')[0]}
                    </div>
                    <div className="groups">
                        {data.groupNamesArr.map((groupName, index) => (
                            <div className="group" key={index}>{groupName}</div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Avatar({source}) {
    return (
        <div className="avatar-container">
            <img src={source}
                alt=''
                title=''
                className='img'
            />
            <div className="hover-wrapper">
                <OpenIcon
                    className='icon'
                />
            </div>
            <div className="active-wrapper">
                Active
            </div>
        </div>
    )
}