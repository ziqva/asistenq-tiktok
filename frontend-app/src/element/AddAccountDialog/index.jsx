import {useEffect, useState} from 'react'
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
} from '@mui/material'
import './add-account-dialog.scss'
import {
    Input,
    Checkbox,
    Alert,
    Cascader,
    Select
} from 'antd'
import NameIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PasswordIcon from '@mui/icons-material/Password'
import PasswordShowIcon from '@mui/icons-material/Visibility'
import PasswordHideIcon from '@mui/icons-material/VisibilityOff'
import AuthenticatorIcon from '@mui/icons-material/Key'
import LabelIcon from '@mui/icons-material/Label'
import addAccount from 'utils/main/account/add'
import ErrorIcon from '@mui/icons-material/Error'
import getGroupData from 'utils/group/getData'

export default function AddAccountDialog({open, onClose, onAdded}) {

    const [loading, setLoading] = useState(false)
    const [passwordShow, setPasswordShow] = useState(true)
    const [availableGroups, setAvailableGroups] = useState([])
    const [useAuthenticator, setUseAuthenticator] = useState(true)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [authenticator, setAuthenticator] = useState('')
    const [labels, setLabels] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        if(open) {
            getGroupData()
            .then(data => {
                setAvailableGroups(data.groups)
            })
            .catch(err => {})
            }
    }, [open])

    useEffect(() => {
        !useAuthenticator && setAuthenticator('')
    }, [useAuthenticator])

    useEffect(() => {
        setError(null)
    }, [open])

    const add = () => {
        setLoading(true)
        addAccount({
            name: name,
            email: email,
            password: password,
            useAuthenticator: useAuthenticator,
            authenticator: authenticator,
            labels: labels.join(',')
        })
        .then((msg) => {
            setLoading(false)
            setName('')
            setEmail('')
            setPassword('')
            setAuthenticator('')
            onClose()
        })
        .catch(err => {
            setLoading(false)
            console.error(err)
            setError(err.message || err)
        })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className='element add-account-dialog'
        >
            <DialogTitle fontSize={16}>Tambahkan Akun</DialogTitle>
            <DialogContent>
                <div className="form">
                    {typeof error === 'string' && (
                        <Alert 
                            message={error}
                            type='error'
                            icon={<ErrorIcon />}
                            showIcon={true}
                        />
                    )}
                    <Input
                        prefix={<NameIcon className='input-icon' />}
                        placeholder='Nama'
                        disabled={loading}
                        value={name}
                        onChange={sender => setName(sender.target.value)}
                    />
                    <Input 
                        placeholder='Alamat Email'
                        prefix={<EmailIcon className='input-icon' />}
                        disabled={loading}
                        value={email}
                        onChange={sender => setEmail(sender.target.value)}
                    />
                    <Input 
                        placeholder='Kata Sandi'
                        onChange={sender => setPassword(sender.target.value)}
                        prefix={<PasswordIcon className='input-icon' />}
                        type={passwordShow ? 'text' : 'password'}
                        disabled={loading}
                        value={password}
                        suffix={(
                            <button className="show-password-toggle"
                                onClick={() => setPasswordShow(x => !x)}
                            >
                                {!passwordShow && <PasswordShowIcon className='icon' />}
                                {passwordShow && <PasswordHideIcon className='icon' />}
                            </button>
                        )}
                    />
                    <Input 
                        placeholder='Secret Autenticator'
                        prefix={<AuthenticatorIcon className='input-icon' />}
                        value={authenticator}
                        onChange={sender => setAuthenticator(sender.target.value)}
                        disabled={loading || !useAuthenticator}
                    />
                    <Select 
                        placeholder='Label'
                        mode='multiple'
                        style={{width: '100%'}}
                        options={availableGroups.map(group => {
                            return {
                                name: group.name,
                                value: group.name
                            }
                        })}
                        value={labels}
                        onChange={(val) => setLabels(val)}
                        maxTagCount={6}
                        dropdownStyle={{
                            zIndex: 10000
                        }}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <div className="actions">
                    <div className="left">
                        <Checkbox
                            disabled={loading}
                            checked={useAuthenticator}
                            onChange={sender => setUseAuthenticator(sender.target.checked)}
                        >Gunakan Authenticator</Checkbox>
                    </div>
                    <div className="right">
                        <button
                            className='cancel-btn'
                            disabled={loading}
                            onClick={onClose}
                        >Batal</button>
                        <button
                            onClick={add}
                            className='submit-btn'
                            disabled={loading}
                        >Simpan</button>
                    </div>
                </div>
            </DialogActions>
        </Dialog>
    )
}