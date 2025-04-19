import {
    Button,
    Checkbox,
    Switch
} from 'antd'
import { useEffect, useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions
} from '@mui/material'
import MainData from 'utils/customColumn/MainData'

let md

export default function CustomColumn({ style, data, onData }) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        md = new MainData()
        md.onMainData = data => {
            onData(data)
        }
    }, [])

    return (
        <div className="custom-column-container" style={style}>
            <Button
                type='primary'
                size='small'
                disabled={open}
                onClick={() => setOpen(x => !x)}
            >Column</Button>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                className='custom-column-dialog'
            >
                <DialogTitle>
                    Column
                </DialogTitle>
                <DialogContent>
                    <div className="content">
                        {data.map((item, index) => (
                            <div className="column-item" key={index}>
                                <div className="name">
                                    {item.name}
                                </div>
                                <Switch
                                    checked={item.active}
                                    className='active-check'
                                    size='small'
                                    onChange={sender => {
                                        if (md) {
                                            md.setActive({
                                                name: item.name,
                                                index: item.index,
                                                state: sender,
                                            })
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button
                        size='small'
                        danger
                        type='primary'
                        onClick={() => setOpen(false)}
                    >Tutup</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}