import {
    Tooltip
} from '@mui/material'
import zoom from 'static/icon/zoom.png'
import help from 'static/icon/help.png'
import {
    Slider
} from 'antd'
import { useEffect, useState } from 'react'
import zoomLevelSet from 'utils/zoomLevel/set'
import zoomLevelGet from 'utils/zoomLevel/get'

export default function ZoomLevel() {
    const [level, setLevel] = useState(0)

    useEffect(() => {
        zoomLevelGet().then(data => setLevel(data.size))
    }, [])

    return (
        <div className="setting">
            <Tooltip title='Zoom Level - sesuaikan ukuran element element di aplikasi sesuai dengan keinginan anda'>
                <img
                    className='help'
                    alt=''
                    src={help}
                />
            </Tooltip>
            <div className="setting-title">
                <img
                    alt=''
                    className='icon'
                    src={zoom}
                />
                <div className="text">Zoom Level ({level}%)</div>
            </div>
            <div className="content">
                <Slider 
                    onChange={sender => setLevel(sender)}
                    min={50}
                    value={level}
                    max={300}
                    onAfterChange={val => {
                        zoomLevelSet(val)
                    }}
                    marks={{
                        80: '80%',
                        120: '120%',
                        180: '180%'
                    }}
                    tooltip={{open: false}}
                />
            </div>
        </div>
    )
}