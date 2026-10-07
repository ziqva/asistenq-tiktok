import icon from 'static/icon/setting-cpu.png'
import {
    Slider
} from 'antd'
import { useEffect, useState } from 'react'
import Setting from 'utils/Setting'
import { Tooltip } from '@mui/material'
import help from 'static/icon/help.png'

const setting = new Setting()

export default function Thread() {
    const [value, setValue] = useState(1)
    const [message, setMessage] = useState('')

    useEffect(() => {
        setting.get('thread')
        .then(val => setValue(val))
        return () => setValue(1)
    }, [])

    useEffect(() => {
        if(value >= 8 && value < 11) {
            setMessage(`Dengan thread ${value} akan memakan performa lumayan besar, pastikan performa komputer anda mecukupi untuk mendapatkan kecepatan maksimal !`)
        } else if(value >= 11 && value <= 15) {
            setMessage(`Dengan thread ${value} akan memakan performa dan juga internet yang stabil dan kencang, pastikan kedua sumber tersebut mencukupi untuk mendapatkan kecepatan maksimal !`)
        } else {
            setMessage('')
        }
    }, [value])

    return (
        <div className="setting">
            <Tooltip title={`
                Sebuah pekerja yang bekerja bersamaan dalam satu waktu untuk melakukan update pada masing masing akun,
                semakin tinggi nilai thread tidak menjamin kecepatan tinggi juga, karena fitur thread juga memerlukan koneksi yang stabil dan juga performa yang memadai untuk dapat memberikan pengalaman lebih.
            `}>
                <img src={help} alt="" className="help" draggable={false} />
            </Tooltip>
            <div className="setting-title">
                <img 
                    src={icon}
                    alt="" 
                    className="icon" />
                <div className="text">Thread Update ({value})</div>
            </div>
            <div className="content">
                <Slider
                    min={1}
                    value={value}
                    onChange={val => setValue(val)}
                    max={15}
                    onAfterChange={finalValue => {
                        setting.set('thread', finalValue)
                    }}
                    marks={{
                        1: '1',
                        4: '4',
                        8: '8',
                        15: '15'
                    }}
                />
                {message.length > 0 && (
                    <div className="info">{message}</div>
                )}
            </div>
        </div>
    )
}