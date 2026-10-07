import {
    Tooltip
} from '@mui/material'
import help from 'static/icon/help.png'
import Setting from 'utils/Setting'
import { useEffect, useState } from 'react'
import {
    Slider
} from 'antd'
import timeoutIcon from 'static/icon/timeout.png'
import formatTimeUnit from 'utils/formatTimeUnit'

const setting = new Setting()

export default function AuthTimeout() {
    const [timeout, setTimeout] = useState(0)

    useEffect(() => {
        setting.get('auth_timeout')
        .then((val) => {
            setTimeout(val)
        })
        .catch(err => window.alert(`Failed for get the setting "auth_timeout": ${err.message || err}`))
    }, [])

    return (
        <div className="setting">
            <Tooltip
                title='Suatu nilai sebagai timeout (waktu habis) untuk proses login'
            >
                <img
                    src={help}
                    className='help'
                    draggable={false}
                    alt=''
                />
            </Tooltip>
            <div className="setting-title">
                <img 
                    src={timeoutIcon}
                    draggable={false}
                    className='icon'
                    alt=''
                />
                <div className="text">Login Timeout ({formatTimeUnit.fromMs(timeout)})</div>
            </div>
            <div className="content">
                <Slider
                    min={15}
                    onChange={sender => setTimeout(sender)}
                    max={600000}
                    value={timeout}
                    tooltip={{
                        open: false
                    }}
                    onAfterChange={val => {
                        setting.set('auth_timeout', val)
                    }}
                    marks={{
                        60000: '60 detik',
                        180000: '3 menit',
                        420000: '7 menit'
                    }}
                />
            </div>
        </div>
    )
}