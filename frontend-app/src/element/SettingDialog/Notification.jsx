import Tooltip from '@mui/material/Tooltip'
import {
    Slider,
    Switch,
    Select,
    Button,
    message,
    Divider
} from 'antd'
import icon from 'static/icon/notification.png'
import { useEffect, useState } from 'react'
import notificationGet from 'utils/notification/get'
import volumeMinIcon from 'static/icon/volume-min.png'
import volumePlusIcon from 'static/icon/volume-plus.png'
import notificationUpdate from 'utils/notification/update'
import notificationShow from 'utils/notification/show'
import CloseIcon from '@mui/icons-material/Close';
import addNewRingtone from 'utils/notification/addNewRingtone'
import removeCustomRingtone from 'utils/notification/removeCustomRingtone'

export default function Notification() {
    const [soundActive, setSoundActive] = useState(false)
    const [toastActive, setToastActive] = useState(false)
    const [sound, setSound] = useState('')
    const [soundFilenames, setSoundFilenames] = useState([])
    const [soundVolume, setSoundVolume] = useState(0)
    const [fetched, setFetched] = useState(false)
    const [customs, setCustoms] = useState([])

    const removeCustom = (name) => {
        removeCustomRingtone(name)
            .then(() => {
                message.success(`Sound "${name} telah berhasil dihapus"`)
                refreshNotificationData()
            })
            .catch(err => message.error(err.message || err))
    }

    useEffect(() => {
        if (fetched) {
            update()
        }
    }, [soundActive, toastActive, sound, soundVolume])


    const add = () => {
        addNewRingtone()
            .then(() => {
                refreshNotificationData()
                message.success('Ringtone telah berhasil ditambahkan')
            })
            .catch(err => message.error(err.message || err))
    }

    const update = () => {
        notificationUpdate({
            soundActive: soundActive,
            soundFilename: sound,
            toastActive: toastActive,
            soundVolume: soundVolume
        })
            .then(() => { })
            .catch(err => { console.error(err) })
    }

    const refreshNotificationData = () => {
        notificationGet()
            .then((data) => {
                setSound(data.soundFilename)
                setToastActive(data.toastActive)
                setSoundActive(data.soundActive)
                setSoundFilenames(data.soundFilenames)
                setSoundVolume(data.soundVolume)
                setFetched(true)
                setCustoms(data.customList)
                console.log(data.customList)
            })
            .catch(err => { })

        return () => {
            setSoundActive(false)
            setToastActive(false)
            setSound('')
            setSoundFilenames([])
            setSoundVolume(0)
        }
    }

    useEffect(() => {
        refreshNotificationData()
    }, [])

    return (
        <div className="setting setting-notification">
            <div className="setting-title">
                <img
                    src={icon}
                    alt=''
                    className='icon'
                />
                <div className="text">Notifikasi</div>
            </div>
            <div className="content">
                <div className="menus">
                    <div className="menu" onClick={() => {
                        setToastActive(x => !x)
                    }}>
                        <Switch
                            size='small'
                            className='switch'
                            checked={toastActive}
                        />
                        <div className="menu-text">Toast</div>
                    </div>
                    <div className="menu" onClick={() => {
                        setSoundActive(x => !x)
                    }}>
                        <Switch
                            size='small'
                            className='switch'
                            checked={soundActive}
                        />
                        <div className="menu-text">Sound</div>
                    </div>
                </div>
                <Select className='select-sound-filename'
                    value={sound}
                    placeholder='Pilih sound'
                    disabled={!soundActive}
                    onChange={val => {
                        setSound(val)
                    }}
                    dropdownStyle={{
                        zIndex: 10000
                    }}
                    options={[...soundFilenames.map(x => {
                        return {
                            label: x,
                            value: x
                        }
                    })]}
                />
                <Tooltip title='Volume'>
                    <div className="volume-container">
                        <img
                            alt='volume-min'
                            src={volumeMinIcon}
                        />
                        <Slider
                            className='slider-sound-volume'
                            min={0}
                            max={100}
                            tooltip={{
                                open: false
                            }}
                            disabled={!soundActive}
                            value={soundVolume}
                            onChange={e => setSoundVolume(e)}
                        />
                        <img
                            alt='volume-plus'
                            src={volumePlusIcon}
                        />
                    </div>
                </Tooltip>
                <div className="test-case">
                    <Button
                        size='small'
                        type='dashed'
                        danger
                        onClick={() => {
                            notificationShow({
                                title: "AsistenQ",
                                message: "Knock Knock..."
                            })
                        }}
                    >Test</Button>
                    <Button size='small'
                        type='primary'
                        onClick={add}
                    >
                        Add new ringtone
                    </Button>
                </div>
                {customs.length > 0 && (
                    <>
                        <Divider>
                            <div style={{
                                color: 'dimgray',
                                fontSize: '11px'
                            }}>Custom Ringtone</div>
                        </Divider>
                        <div className="custom-list">
                            {customs.map((custom, i) => (
                                <div className='custom-item' key={i}>
                                    <div className='text'>{custom}</div>
                                    <button className='remove-btn' onClick={() => {
                                        removeCustom(custom)
                                    }}>
                                        <CloseIcon className='remove-icon' />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}