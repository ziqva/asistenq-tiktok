import {
    Button,
    Badge,
    Empty
} from 'antd'
import CloudIcon from '@mui/icons-material/FilterDrama';
import { useEffect, useState } from 'react'
import './index.scss'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material'
import getUpdates from 'utils/updater/getUpdates'
import moment from 'moment-timezone'
import 'moment/locale/id'
import updateUpdate from 'utils/updater/update'

import newIcon from 'static/icon/new.png'
import fixIcon from 'static/icon/fix.png'
import changeIcon from 'static/icon/change.png'

const getIcon = type => {
    if(type === 'change') {
        return changeIcon
    } else if(type === 'bug') {
        return fixIcon
    } else {
        return newIcon
    }
}

export default function UpdaterDialog() {
    const [availableUpdate, setAvailableUpdate] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <div className="updater-dialog element">
            <div className="toggle-btn-container">
                <Badge dot={availableUpdate}>
                    <Button
                        className='toggle-btn'
                        icon={<CloudIcon />}
                        onClick={() => setDialogOpen(x => !x)}
                        type='text'
                    />
                </Badge>
            </div>
            <TheDialog 
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            />
        </div>
    )
}

function TheDialog({open, onClose}) {
    const [updates, setUpdates] = useState([])

    useEffect(() => {
        if(open) {
            getUpdates()
            .then(updates => setUpdates(updates.map(x => {
                x.notes = JSON.parse(x.notes)
                x.notes.map(x => {
                    x.icon = getIcon(x.type)
                })
                return x
            })))
            .catch(err => console.error(err))
        } else {
            setUpdates([])
        }
    }, [open])

    return (
        <Dialog className='the-dialog-of-update'
            open={open}
            onClose={onClose}
        >
            <DialogTitle className='title'>
                <CloudIcon className='icon' />
                <div className="text">Update</div>
            </DialogTitle>
            <DialogContent style={{overflowX: 'hidden'}}>
                {updates.length < 1 && (
                    <Empty
                        description='No update are available'
                    />
                )}
                {updates.length > 0 && (
                    <div className="update-list">
                        {updates.map((update, index) => (
                            <div className="update" key={index}>
                                <div className="head">
                                    <div className="version">• {update.build_version_str}</div>
                                    <div className="right">
                                        <div className="date">{moment(update.uploaded * 1000).tz('Asia/Jakarta').format('D MMM YYYY HH:mm')}</div>
                                        <div className="update-btn">
                                            <Button
                                                size='small'
                                                type='link'
                                                onClick={sender => {
                                                    updateUpdate(update.zip_file)
                                                    .catch(err => console.error(err.message || err))
                                                }}
                                            >Update</Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="notes">
                                    {update.notes.map((note, index) => (
                                        <div className="note" key={index}>
                                            <img
                                                src={note.icon}
                                                alt={note.type}
                                            />
                                            <div className="note-text">{note.note}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    danger
                    type='primary'
                >Tutup</Button>
            </DialogActions>
        </Dialog>
    )
}