import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogBody,
    DialogActions
} from '@mui/material'
import {
    Button,
} from 'antd'
import './setting-dialog.scss'
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import settingIcon from 'static/icon/setting.png'
import Delay from './Delay'
import Thread from './Thread'
import { useEffect, useState } from 'react'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import restart from 'utils/app/restart'
import AuthTimeout from './AuthTimeout'
import ZoomLevel from './ZoomLevel';
import Notification from './Notification'
import ChatNotificationState from './ChatNotificationState'
import LiveChat from './LiveChat'
import ChromeExtension from './ChromeExtension';
import LogoutDetection from './LogoutDetection';
import PublicMonitoring from './PublicMonitoring'
let confirmedInterval

export default function Setting({ open, onClose }) {
    const [confirmed, setConfirmed] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleClick = () => {
        if(!confirmed) {
            setConfirmed(true)
        } else {
            setConfirmed(false)
            setLoading(true)
            restart()
            .then(() => {
                setLoading(false)
            })
            .catch(err => {
                window.alert(err.message || err)
                setLoading(false)
            })
        }
    }

    useEffect(() => {
        if(confirmed) {
            if(confirmedInterval) { clearTimeout(confirmedInterval) }
            confirmedInterval = setTimeout(() => {
                setConfirmed(false)
            }, 5000)
        }
    }, [confirmed])

    return (
        <Dialog open={open} onClose={onClose} className='setting-global-dialog'>
            <DialogTitle>
                <div className="dialog-title">
                    <img src={settingIcon}
                        alt=""
                        draggable={false}
                        className='icon'
                    />
                    <div className="text">Pengaturan</div>
                </div>
            </DialogTitle>
            <DialogContent>
                <div className="settings">
                    <Delay />
                    <Thread />
                    <AuthTimeout />
                    {/* <LogoutDetection /> */}
                    <ZoomLevel />
                    <Notification />
                    <LiveChat />
                    <ChatNotificationState />
                    <ChromeExtension />
                    <PublicMonitoring />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    className='btn-restart-app'
                    style={{
                        color: confirmed ? 'red' : ''
                    }}
                    danger={confirmed}
                    onClick={handleClick}
                    loading={loading}
                    icon={
                        <>
                            {!confirmed && <RestartAltIcon className='icon' />}
                            {confirmed && <QuestionMarkIcon className='icon' />}
                        </>
                    }
                >{confirmed ? 'Klik untuk konfirmasi' : 'Restart App'}</Button>
            </DialogActions>
        </Dialog>
    )
}
