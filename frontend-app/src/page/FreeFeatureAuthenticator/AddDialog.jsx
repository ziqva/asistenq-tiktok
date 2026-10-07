import { useEffect, useState } from "react"
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material'
import {
    Button,
    Input
} from 'antd'
import authAdd from 'utils/free-feature/authenticator/add'

export default function AddDialog({open, onClose}) {
    const [label, setLabel] = useState('')
    const [email, setEmail] = useState('')
    const [authenticator, setAuthenticator] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if(!open) {
            setLabel('')
            setEmail('')
            setAuthenticator('')
        }
    }, [open])

    const handleAdd = () => {
        setLoading(true)
        authAdd({
            label,
            email,
            authenticator
        })
        .then(() => {
            setLoading(false)
            onClose()
        })
        .catch(err => {
            window.alert(err.message || err)
            setLoading(false)
        })
    }

    return (
        <Dialog open={open} onClose={onClose} className='free-feature-authenticator-add-dialog'>
            <DialogTitle className='dialog-title'>Tambah</DialogTitle>
            <DialogContent>
                <div className="form">
                    <Input
                        className='form-control'
                        placeholder='Label'
                        value={label}
                        disabled={loading}
                        onChange={sender => setLabel(sender.target.value)}
                    />
                    <Input 
                        className="form-control" 
                        placeholder='Email'
                        value={email}
                        disabled={loading}
                        onChange={sender => setEmail(sender.target.value)}
                    />
                    <Input 
                        className='form-control'
                        placeholder='Secret Authenticator'
                        value={authenticator}
                        disabled={loading}
                        onChange={sender => setAuthenticator(sender.target.value)}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    danger
                    onClick={onClose}
                    disabled={loading}
                >Batal</Button>
                <Button
                    disabled={label.length < 3 || email.length < 3}
                    loading={loading}
                    onClick={handleAdd}
                    type='primary'
                >Tambah</Button>
            </DialogActions>
        </Dialog>
    )
}