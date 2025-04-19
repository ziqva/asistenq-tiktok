import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useState } from 'react'

export default function ButtonToggle({show, opened, onToggle}) {

    const toggleListener = (sender) => {
        if(
            sender.keyCode === 67 &&
            sender.altKey
        ) {
            onToggle()
        }
    }

    useEffect(() => {
        if(show) {
            window.addEventListener('keydown', toggleListener)
        } else {
            window.removeEventListener('keydown', toggleListener)
        }

        return (() => {
            window.removeEventListener('keydown', toggleListener)
        })
    }, [show])

    return (
        <div className="btn-toggle-container"
            data-show={show}
        >
            <Tooltip title='Shortcut: ALT + C'>
                <button
                    className='btn-toggle'
                    onClick={onToggle}
                    data-opened={opened}
                >
                    <ChatIcon className='icon' data-show={!opened} />
                    <CloseIcon className='icon' data-show={opened} />
                </button>
            </Tooltip>
        </div>
    )
}