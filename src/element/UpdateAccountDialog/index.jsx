import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions
} from '@mui/material'
import './update-account-dialog.scss'
import {
    Button,
    Input,
    Checkbox,
    Alert,
    Select
} from 'antd'
import SaveIcon from '@mui/icons-material/Save'
import { useEffect, useState } from 'react'
import NameIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PasswordIcon from '@mui/icons-material/Password'
import KeyIcon from '@mui/icons-material/Key'
import LabelIcon from '@mui/icons-material/Label'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import accountGet from 'utils/main/account/get'
import accountUpdate from 'utils/main/account/update'   
import getGroupData from 'utils/group/getData'

export default function UpdateAccountDialog({id, onClose}) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [secretAuthenticator, setSecretAuthenticator] = useState('')
    const [useSecretAuthenticator, setUseSecretAuthenticator] = useState(false)
    const [groupNames, setGroupNames] = useState([])
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [availableGroups, setAvailableGroups] = useState([])

    useEffect(() => {
        if(typeof id === 'number') {
            accountGet(id)
            .then((data) => {
                setName(data.name)
                setEmail(data.email)
                setPassword(data.password)
                setGroupNames(data.groupNames.split(','))
                setUseSecretAuthenticator(data.useAuthenticator)
                setSecretAuthenticator(data.secretAutenticator)
            })
            .catch(err => {
                window.alert(err.message || err)
                onClose()
            })


            getGroupData()
            .then((data) => {
                setAvailableGroups(data.groups)
            })
            .catch(err => {})
        } else {
            setName('')
            setEmail('')
            setPassword('')
            setSecretAuthenticator('')
            setUseSecretAuthenticator(false)
            setGroupNames([])
            setShowPassword(false)
            setError(null)
        }
    }, [id])

    const handleUpdate = () => {
        setLoading(true)
        setError(null)
        accountUpdate({
            id: id,
            name: name,
            email: email,
            password: password,
            useAuthenticator: useSecretAuthenticator,
            groupNames: groupNames.join(','),
            secretAutenticator: secretAuthenticator
        })
        .then(() => {
            setLoading(false)
            setError(null)
            onClose()
        })
        .catch(err => {
            setError(err.message || err)
            setLoading(false)
            console.error(err.message || err)
        })
    }

    useEffect(() => {
        if(!useSecretAuthenticator) { setSecretAuthenticator('') }
    }, [useSecretAuthenticator])

    return (
        <Dialog
            open={typeof id === 'number'}
            onClose={onClose}
            className='update-account-dialog element'
        >
            <DialogTitle>
                <div className="dialog-title">
                    <div className="text">Edit Akun</div>
                </div>
            </DialogTitle>
            <DialogContent>
                <div className="form">
                    {error && (
                        <Alert
                            message={error}
                            type='error'
                            showIcon
                        />
                    )}
                    <Input
                        placeholder='Nama'
                        disabled={loading}
                        prefix={<NameIcon className='icon' />}
                        value={name}
                        onChange={sender => setName(sender.target.value)}
                    />
                    <Input
                        placeholder='Alamat Email'
                        disabled={loading}
                        prefix={<EmailIcon className='icon' />}
                        value={email}
                        onChange={sender => setEmail(sender.target.value)}
                    />
                    <Input
                        placeholder='Kata Sandi'
                        disabled={loading}
                        prefix={<PasswordIcon className='icon' />}
                        value={password}
                        type={showPassword ? 'text' : 'password'}
                        onChange={sender => setPassword(sender.target.value)}
                        suffix={(
                            <button 
                                className='show-password-toggle-btn'
                                onClick={() => setShowPassword(x => !x)}
                                disabled={loading}
                            >
                                {showPassword && <VisibilityOffIcon className='icon' />}
                                {!showPassword && <VisibilityIcon className='icon' />}
                            </button>
                        )}
                    />
                    <Input
                        placeholder='Secret Authenticator'
                        disabled={loading || !useSecretAuthenticator}
                        prefix={<KeyIcon className='icon' />}
                        value={secretAuthenticator}
                        onChange={sender => setSecretAuthenticator(sender.target.value)}
                    />
                    {/* <Input
                        placeholder='Label (pisahkan dengan koma)'
                        disabled={loading}
                        prefix={<LabelIcon className='icon' />}
                        value={groupNames}
                        onChange={sender => setGroupNames(sender.target.value)}
                    /> */}
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
                        value={groupNames}
                        onChange={(val) => setGroupNames(val)}
                        maxTagCount={6}
                        dropdownStyle={{
                            zIndex: 10000
                        }}
                     />
                </div>
            </DialogContent>
            <DialogActions className='dialog-actions'>
                <Checkbox
                    disabled={loading}
                    checked={useSecretAuthenticator}
                    onChange={sender => setUseSecretAuthenticator(sender.target.checked)}
                    className='use-secret-authenticator-toggle'
                >Gunakan Authenticator</Checkbox>
                <div className="right-actions">
                    <Button
                        danger
                        type='dashed'
                        onClick={onClose}
                        disabled={loading}
                    >Batal</Button>
                    <Button 
                        className='save-btn'
                        type='primary'
                        disabled={loading}
                        icon={<SaveIcon />}
                        onClick={handleUpdate}
                    >Simpan</Button>
                </div>
            </DialogActions>
        </Dialog>
    )
}