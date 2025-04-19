import {
    Input,
    IconButton,
    Button,
    Alert,
    Avatar
} from 'antd'
import { useEffect, useState } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import randomAvatar from 'utils/liveChat/randomAvatar'
import updateName from 'utils/liveChat/updateName'

export default function InitUsername({ closeable, onClose, profile, onRefresh, machineId }) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('Masukkan nama anda')

    useEffect(() => {
        profile && setName(profile.name)
        if(profile && profile.updatedName) { setMsg(null) }
    }, [profile])

    return (
        <div className="init-username">
            <div className="wrapper">
                <div className="init-username-container">
                    <div className="avatar-container">
                        {!loading && profile !== undefined &&<Avatar
                            src={profile ? profile.avatar : ''}
                            size='large'
                            className='avatar-img'
                        />}
                        <Button
                            disabled={loading}
                            type='dashed'
                            size='small'
                            className='update-avatar-btn'
                            icon={<RefreshIcon className='icon' />}
                            onClick={() => {
                                setLoading(true)
                                randomAvatar(machineId)
                                .then((data) => {
                                    onRefresh()
                                    setLoading(false)
                                })
                                .catch(err => {
                                    window.alert(err.message || err)
                                    setLoading(false)
                                })
                            }}
                        >Ubah</Button>
                    </div>
                    {!closeable || typeof msg === 'string' && (
                        <Alert
                            message={msg}
                            type='warning'
                            showIcon
                        />
                    )}
                    <Input
                        disabled={loading}
                        placeholder='Nama'
                        value={name}
                        onChange={sender => setName(sender.target.value)}
                    />
                    <div className="actions">
                        {closeable && <Button
                            size='small'
                            type='default'
                            danger
                            disabled={loading}
                            onClick={onClose}
                        >Tutup</Button>}
                        <Button
                            size='small'
                            disabled={loading}
                            type='default'
                            style={{ fontWeight: 500 }}
                            onClick={() => {
                                setLoading(true)
                                setMsg(null)
                                updateName({
                                    machineId: machineId,
                                    name: name
                                })
                                .then(() => {
                                    setLoading(false)
                                    onRefresh()
                                    setMsg(null)
                                })
                                .catch(err => {
                                    setMsg(err.message || err)
                                    setLoading(false)
                                })
                            }}
                        >Simpan Nama</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}