import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle
} from '@mui/material'
import {
    Button,
    Input
} from 'antd'
import authUpdate from 'utils/free-feature/authenticator/update'

export default function EditDialog({open, onClose, data}) {
    const [email, setEmail] = useState('')
    const [label, setLabel] = useState('')
    const [secret, setSecret] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if(open) {
            setEmail(data.email)
            setLabel(data.label)
            setSecret(data.secret)
        }
    }, [open])

    const update = () => {
        setLoading(true)
        authUpdate({label, email, secret, id: data.id})
        .then(() => {
            setLoading(false)
            onClose()
        })
        .catch(err => {
            window.alert(err.message || err)
        })
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className='free-feature-authenticator-edit-dialog'
        >
            <DialogTitle>Edit</DialogTitle>
            <DialogContent>
                <div className="form">
                    <Input
                        disabled={loading}
                        placeholder='Label'
                        value={label}
                        onChange={sender => setLabel(sender.target.value)}
                    />
                    <Input 
                        disabled={loading}
                        placeholder='Email'
                        value={email}
                        onChange={sender => setEmail(sender.target.value)}
                    />
                    <Input 
                        placeholder='Secret Authenticator'
                        disabled={loading}
                        value={secret}
                        onChange={sender => setSecret(sender.target.value)}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    disabled={loading}
                    danger
                    onClick={onClose}
                >Batal</Button>
                <Button
                    laoding={loading}
                    type='primary'
                    onClick={update}
                >Ubah</Button>
            </DialogActions>
        </Dialog>
    )
}