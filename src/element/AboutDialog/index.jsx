import {
    Button,
    Divider
} from 'antd'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions
} from '@mui/material'
import aboutIcon from 'static/icon/about.png'
import './index.scss'
import {useEffect, useState} from 'react'
import getData from 'utils/device/getData'
import openExternalLink from 'utils/app/openExternalLink'

export default function AboutDialog({open, onClose}) {
    const [data, setData] = useState(undefined)

    useEffect(() => {
        if (open) {
            getData()
                .then((data) => setData(data))
                .catch(err => console.error(err.message || err))
        } else {
            setData(undefined)
        }
    }, [open])

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className='about-dialog element'
        >
            <DialogTitle className='dialog-title'>
                <img
                    className='icon'
                    src={aboutIcon}
                    draggable={false}
                    alt=''
                />
                <div className="name">About</div>
            </DialogTitle>
            <DialogContent className='content'>
                {data && (
                    <div className="items">
                        <ul className="item os">
                            <Divider orientation='left'>User</Divider>
                            <li>
                                <div className="list">
                                    <div className="name">Name</div>
                                    <div className="value">{data.user.name}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Email</div>
                                    <div className="value">{data.user.email}</div>
                                </div>
                            </li>
                        </ul>
                        <ul className="item os">
                            <Divider orientation='left'>Device</Divider>
                            <li>
                                <div className="list">
                                    <div className="name">Label</div>
                                    <div className="value">{data.device.label}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Machine ID</div>
                                    <div className="value">{data.device.machineId}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Created</div>
                                    <div className="value">{data.device.created}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Expired</div>
                                    <div className="value">{data.device.expired}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Remaining Time</div>
                                    <div className="value">{data.device.remaining}</div>
                                </div>
                            </li>
                        </ul>
                        <ul className="item os">
                            <Divider orientation='left'>OS</Divider>
                            <li>
                                <div className="list">
                                    <div className="name">Computer Name</div>
                                    <div className="value">{data.os.computer_name}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Platform</div>
                                    <div className="value">{data.os.platform}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Type</div>
                                    <div className="value">{data.os.type}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Uptime</div>
                                    <div className="value">{data.os.uptime}</div>
                                </div>
                            </li>
                        </ul>
                        <ul className='item os'>
                            <Divider orientation='left'>Hardware</Divider>
                            <li>
                                <div className="list">
                                    <div className="name">CPU Model</div>
                                    <div className="value">{data.hardware.cpu.model}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">CPU Core(s)</div>
                                    <div className="value">{data.hardware.cpu.core}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">CPU Speed</div>
                                    <div className="value">{data.hardware.cpu.speed}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Memory Total</div>
                                    <div className="value">{data.hardware.memory.total}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Memory Free</div>
                                    <div className="value">{data.hardware.memory.free}</div>
                                </div>
                            </li>
                            <li>
                                <div className="list">
                                    <div className="name">Memory Used</div>
                                    <div className="value">{data.hardware.memory.used}</div>
                                </div>
                            </li>
                        </ul>
                        <ul className="item contacts">
                            <Divider orientation='left'>Contact Helper</Divider>
                            {data.contacts.map((contact, index) => (
                                <li>
                                    <div className="list" key={index}>
                                        <div className="name">{contact.name}</div>
                                        <div className="value link" onClick={() => {
                                            openExternalLink(contact.link)
                                                .then(() => {
                                                })
                                                .catch(err => {
                                                    console.error(err.message || err)
                                                })
                                        }}>{contact.link}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    danger
                    type='primary'
                    onClick={onClose}
                >Tutup</Button>
            </DialogActions>
        </Dialog>
    )
}