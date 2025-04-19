import Tooltip from '@mui/material/Tooltip'
import {
    Slider,
    Switch,
    Select,
    Button,
    message,
    Divider,
    Input
} from 'antd'
import icon from 'static/icon/sharing.png'
import { useEffect, useState } from 'react'
import axios from 'axios'
import conf from '../../config/server'

export default function PublicMonitoring() {
   
    const [alias, setAlias] = useState('')
    const [activeLoading, setActiveLoading] = useState(true)
    const [isActive, setIsActive] = useState(false)
    const [saveLoading, setSaveLoading] = useState(true)

    const fetchIsActive = () => {
        // Fetch is active
        const url1 = `${conf.api.base}/public-monitoring/active`
        axios.get(url1)
            .then(({data}) => {
                if(!data.error) {
                    setIsActive(data.data.active)
                }
            })
            .catch(err => { console.error(err.message || err) })
            .finally(() => {
                setActiveLoading(false)
            })
    }

    useEffect(() => {
        // Fetch alias name 
        const url = `${conf.api.base}/public-monitoring/alias`
        axios.get(url)
            .then(({data}) => {
                setAlias(data.data.alias)
            })
            .catch(err => { console.error(err.message || err) })
            .finally(() => {
                setSaveLoading(false)
            })
        fetchIsActive()
    }, [])



    const activeToggle = () => {
        setActiveLoading(true)
        const url = `${conf.api.base}/public-monitoring/activeToggle`
        axios.post(url)
        .then(({data}) => {
            if(!data.error) {
                setIsActive(data.data.active)
            } else {
                message.error(data.msg)
            }
        })
        .catch(err => message.error(err.message || err))
        .finally(() => {
            setActiveLoading(false)
        })
    }   

    const changeAlias = () => {
        setSaveLoading(true)
        const url = `${conf.api.base}/public-monitoring/changeAlias`
        axios.post(url, {
            alias: alias
        })
        .then(({data}) => {
            if(data.error) {
                message.error(data.msg)
            } else {
                message.success('Alias berhasil diubah!')
            }
        })
        .finally(() => {
            setSaveLoading(false)
        })
    }

    return (
        <div className="setting setting-notification">
            <div className="setting-title">
                <img
                    src={icon}
                    alt=''
                    className='icon'
                />
                <div className="text">Public Monitoring</div>
            </div>
            <div className="content">
                <Input
                    placeholder='Alias'
                    prefix='@'
                    value={alias}
                    onChange={e => setAlias(e.target.value.trim().toLowerCase().split(' ').join(''))}
                    size='small'
                    allowClear
                />
                <div style={{
                    fontSize: '12px',
                    color: 'var(--main-color)',
                    cursor: 'pointer',
                    marginTop: '5px',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>https://asmon.ziqva.com/{alias}</div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    marginTop: '5px'
                }}>
                    <Switch size='small' checkedChildren='ON' unCheckedChildren='OFF'
                        loading={activeLoading}
                        checked={isActive}
                        onChange={activeToggle}
                    />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        marginLeft: 'auto',
                        marginRight: 0
                    }}>
                        <Button size='small' loading={saveLoading}
                            type='primary'
                            disabled={alias.length < 1}
                            onClick={changeAlias}
                        >Simpan Alias</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}