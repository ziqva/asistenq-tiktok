import settingDelayIcon from 'static/icon/settingDelay.png'
import {
    Slider,
    Alert
} from 'antd'
import { useEffect, useState } from 'react'
import Setting from 'utils/Setting'
import formatTimeUnit from 'utils/formatTimeUnit'
import { Tooltip } from '@mui/material'
import help from 'static/icon/help.png'


const setting = new Setting()

export default function Delay() {
    const [delay, setDelay] = useState(0)
    const [error, setError] = useState(null)

    useEffect(() => {
        setting.get('delay')
        .then((val) => {
            setDelay(val)
        })
        .catch(err => {
            window.alert(`Failed for get the setting "delay": ${err.message || err}`)
        })
        return () => setDelay(0)
    }, [])

    return (
        <div className="setting">
            <Tooltip title={`
                Suatu nilai sebagai waktu istirahat untuk masing masing pekerja berhenti sejenak, hal ini dibuat dengan tujuan untuk meminimalisir terdeteksinya spam oleh Tokopedia.
            `}>
                <img src={help} alt="" className="help" draggable={false} />
            </Tooltip>
            <div className="setting-title">
                <img className="icon"
                    alt=''
                    src={settingDelayIcon}
                    draggable={false}
                />
                <div className="text">Delay Update ({formatTimeUnit.fromMs(delay)})</div>
            </div>
            <div className="content">
                {typeof error === 'string' && (
                    <Alert 
                        message={error}
                        type='error'
                        showIcon
                    />
                )}
                <Slider 
                    min={0}
                    onChange={sender => setDelay(sender)}
                    value={delay}
                    max={5000}
                    tooltip={{
                        open: false,
                    }}
                    onAfterChange={val => {
                        if(val < 30) {
                            setError('Delay harus lebih dari 30 ms')
                        } else {
                            setError(null)
                            setting.set('delay', val)
                        }
                    }}
                    marks={{
                        30: '30 ms',
                        2000: '2 detik',
                    }}
                />
            </div>
        </div>
    )
}