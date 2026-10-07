import {
    Card,
    Avatar,
    Input,
    Button,
} from 'antd'
import icon from 'static/image/icon.ico'
import { useEffect, useState } from 'react'
import deviceActivateLicense from 'utils/device/activateLicense'
import MemoryIcon from '@mui/icons-material/Memory';
import deviceGetMachineId from 'utils/device/getMachineId'
import CopyIcon from '@mui/icons-material/CopyAll'
import {
    Tooltip
} from '@mui/material'
import { CopyToClipboard } from 'react-copy-to-clipboard'

export default function ActivateLicense({ onRefreshAuthenticated, onError }) {
    const [loading, setLoading] = useState(false)
    const [license, setLicense] = useState('')
    const [machineId, setMachineId] = useState('')

    const activate = () => {
        setLoading(true)
        deviceActivateLicense(license)
            .then(() => {
                onRefreshAuthenticated()
                setLoading(false)
            })
            .catch(err => {
                onError(err.message || err)
                setLoading(false)
            })
    }

    useEffect(() => {
        deviceGetMachineId()
            .then((data) => {
                setMachineId(data.machineId)
            })
            .catch(err => { })
    }, [])

    return <div className='activate-license-container'>
        <Card
            style={{ width: 400 }}
            className='activate-license-card'
        >
            <Card.Meta
                avatar={<Avatar src={icon} alt='' />}
                title={<div className='card-title'>Perangkat tidak terdaftar</div>}
                description='Masukkan lisensi untuk mengaktifkan perangkat anda'
            />
            <div className="body">
                <div className="form">
                    <Input
                        placeholder='Masukkan LIsensi'
                        disabled={loading}
                        value={license}
                        onChange={sender => setLicense(sender.target.value)}
                    />
                    <Button
                        type='primary'
                        className='activate-btn'
                        loading={loading}
                        disabled={license.trim().length < 1}
                        onClick={activate}
                    >Aktivasi</Button>
                </div>

                <div className="futer">
                    <Tooltip title='Machine ID'>
                        <div className="machine-id">
                            <MemoryIcon className='icon' />
                            <div className="text">{machineId}</div>
                            <CopyToClipboard text={machineId}>
                                <CopyIcon
                                    className='copy-btn'
                                />
                            </CopyToClipboard>
                        </div>
                    </Tooltip>
                </div>
            </div>

        </Card>
    </div>
}