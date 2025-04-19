import {
    Switch,
    Space
} from 'antd'
import { Tooltip } from '@mui/material'
import liveChat from 'static/icon/live-chat.png'
import help from 'static/icon/help.png'
import { useEffect, useState } from 'react'
import axios from 'axios'
import server from 'config/server'

const setEnabledState = (state, callback) => {
    const url = `${server.api.base}/liveChat/setActive`
    axios.post(url, {
        state: state
    })
        .then(({data}) => {
            if(data.error) {
                console.error(data.msg)
            } else {
                callback && callback()
            }
        })
        .catch(err => console.error(err.message || err))
}

const getState = (callback) => {
    const url = `${server.api.base}/liveChat/isActive`
    axios.get(url)
    .then(({data}) => {
        callback && callback(data.data)
    })
    .catch(err => console.error(err))
}

export default function LogoutDetection() {
    const [enabled, setEnabled] = useState(false)
    const [fetched, setFetched] = useState(false)

    useEffect(() => {
        if(fetched) {
            setEnabledState(enabled, () => { console.log('state has been changed') })
        }
    }, [enabled])

    useEffect(() => {
        getState(data => {
            setEnabled(data)
            setFetched(true)
        })

        return () => {
            setEnabled(false)
            setFetched(false)
        }
    }, [])

    return (
        <div className='setting'>
            <Tooltip
                title='Live Chat'
            >
                <img
                    src={help}
                    alt=''
                    title=''
                    draggable={false}
                    className='help'
                />
            </Tooltip>
            <div className='setting-title'>
                <img
                    src={liveChat}
                    draggable={false}
                    className='icon'
                    alt=''
                />
                <div className='text'>
                    Logout Detection
                </div>
            </div>
            <div className='content'>
                <Space direction='horizontal'>
                    <div style={{
                        fontSize: 13,
                        fontWeight: 500
                    }}>Status:</div>
                    <Switch
                        checked={enabled}
                        onChange={eender => setEnabled(eender)}
                        size='medium'
                        checkedChildren='Enabled'
                        unCheckedChildren='Disabled'
                    />
                </Space>
            </div>
        </div>

    )
}