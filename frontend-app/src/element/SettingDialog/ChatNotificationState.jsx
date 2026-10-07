import Tooltip from '@mui/material/Tooltip'
import chatNotification from 'static/icon/chat-notification.png'
import help from 'static/icon/help.png'
import {
    Switch,
    Space
} from 'antd'
import { useEffect, useState } from 'react'
import Setting from 'utils/Setting'
import { Settings } from '@mui/icons-material'

const setting = new Setting()

export default function ChatNotificationState() {
    const [state, setState] = useState(false)

    const refreshState = () => {
        setting.get('notification_from_chat')
        .then((val) => {
            setState(val == 1)
        })
        .catch(err => {
            console.error(err.message || err)
        })
    }

    useEffect(() => {   
        refreshState()
    }, [])

    const updateState = bool => {
        setting.set('notification_from_chat', bool ? 1 : 0).then(() => { refreshState() })
    }


    return (
        <div className="setting">
            <Tooltip title='Aktifkan notifikasi dari chat diskusi publik'>
                <img 
                    className='help'
                    draggable={false}
                    alt=''
                    src={help}
                />
            </Tooltip>
            <div className="setting-title">
                <img 
                    className='icon'
                    alt=''
                    src={chatNotification}
                    draggable={false}
                />
                <div className="text">Aktifkan Notifikasi Public Chat</div>
            </div>
            <div className="content">
                <Space direction='horizontal'>
                    Status: 
                    <Switch
                    checked={state}
                    onChange={sender => {
                        updateState(sender)
                    }}
                    checkedChildren='Aktif' unCheckedChildren='Nonaktif' />
                </Space>
            </div>
        </div>
    )
}