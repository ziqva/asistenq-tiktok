import CloseIcon from '@mui/icons-material/Close'
import AttachmentIcon from '@mui/icons-material/Attachment';
import SendIcon from '@mui/icons-material/Send'
import {
    Input,
    Avatar,
    Badge
} from 'antd'
import { useEffect, useState, useRef } from 'react'
import InitUsername from './InitUsername'
import getUser from 'utils/liveChat/getUser'
import Tooltip from '@mui/material/Tooltip'
import postMessage from 'utils/liveChat/postMessage';
import VerifiedIcon from '@mui/icons-material/Verified';
import OnlineUsers from './OnlineUsers'
import Attachment from './Attachment'
import TypingUsers from './TypingUsers'
import CachedIcon from '@mui/icons-material/Cached';

let typingTimeout

export default function Chat({ open, onClose, machineId, socketConnected, onUserId, chats, onlineUsers, onTypingState, typingUsers, loadingOldestMessage, onLoadOldestMessage, latestChatId, officeData }) {
    const [usernameUpdated, setUsernameUpdated] = useState(false)
    const [profileShow, setProfileShow] = useState(false)
    const [profileCloseable, setProfileCloseable] = useState(false)
    const [profile, setProfile] = useState(undefined)
    const [attachment, setAttachment] = useState(null)
    const [message, setMessage] = useState('')
    const fileInput = useRef()
    const [sending, setSending] = useState(false)
    const [chatCount, setChatCount] = useState(0)
    const [typing, setTyping] = useState(false)

    useEffect(() => {
        if (typingUsers.length > 0) {
            scrollToBottom()
        }
    }, [typingUsers])

    const typingCheck = () => {
        if (typingTimeout) { clearTimeout(typingTimeout) }
        setTyping(true)
        typingTimeout = setTimeout(() => {
            setTyping(false)
        }, 3000)
    }

    useEffect(() => {
        onTypingState(typing)
    }, [typing])

    useEffect(() => {
        setChatCount(chats.length)
    }, [chats])

    useEffect(() => {
        typingCheck()
    }, [message])


    const scrollToBottom = () => {
        const el = document.querySelector('.messages-inner-container')
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
        console.log('latest chat id: ', latestChatId)
    }, [latestChatId])

    useEffect(() => {
        if (profile && profile.updatedName) {
            onUserId(profile.id)
        }
    }, [profile])
    const getProfile = (closeProfile) => {
        setProfile(undefined)
        getUser(machineId)
            .then((data) => {
                setProfile(data)
                setUsernameUpdated(data.updatedName)
                if (!data.updatedName) {
                    setProfileCloseable(false)
                    setProfileShow(true)
                } else {
                    setProfileCloseable(true)
                    closeProfile === true && setProfileShow(false)
                }
            })
            .catch(err => {
                console.error(err.message || err)
                onClose()
            })
    }

    useEffect(() => {
        getProfile(true)
    }, [])


    useEffect(() => {
        if (!usernameUpdated) {
            setProfileCloseable(false)
            setProfileShow(true)
        } else {
            setProfileCloseable(true)
        }
    }, [usernameUpdated])

    const handleUpdate = () => {
        setSending(true)
        postMessage({ text: message, attachment, senderId: profile ? profile.id : undefined })
            .then(() => {
                setSending(false)
                setAttachment(null)
                setMessage('')
            })
            .catch(err => {
                console.error(err.message || err)
                setSending(false)
            })
    }

    const messagecapture = async () => {

    }

    useEffect(() => {
        messagecapture()
    }, [message])

    return (
        <>
            {open && <div className="chat-wrapper" onClick={onClose}></div>}
            <div className="main-form-container" data-open={open}>
                <input
                    style={{ display: 'none' }}
                    type='file'
                    ref={fileInput}
                    id='attachment-file-input'
                    accept='.gif,.jpg,.jpeg,.png,.mp4,.xlsx,.pdf'
                    onChange={sender => {
                        const { files } = sender.target
                        if (files.length < 1) {
                            setAttachment(null)
                        } else {
                            setAttachment(files[0])
                        }
                    }}
                />
                <div className="main-form-inner">
                    {profileShow && <InitUsername
                        closeable={profileCloseable}
                        onClose={() => setProfileShow(false)}
                        profile={profile}
                        onRefresh={() => getProfile(false)}
                        machineId={machineId}
                    />}
                    <div className="head-element">
                        <div className="title">{onlineUsers.length < 1 ? 'Live Chat' : 'Online: ' + onlineUsers.length + ' users'}</div>
                        {/* {onlineUsers.length > 0 && <OnlineUsers data={onlineUsers} />} */}
                        <button className="close-btn" onClick={() => {
                            setProfileCloseable(true)
                            setProfileShow(true)
                        }}>
                            {profile && (
                                <>
                                    <div className="profile-name">{profile.name}</div>
                                    <Badge dot color='green'>
                                        <Avatar src={profile.avatar} alt={profile.name} className='profile-avatar' />
                                    </Badge>
                                </>
                            )}
                        </button>
                    </div>
                    <div className="messages-inner-container">
                        {chats.length > 0 && (
                            <button
                                className='load-oldest-message'
                                disabled={loadingOldestMessage}
                                onClick={onLoadOldestMessage}
                            >
                                <CachedIcon className='icon' />
                                <div className="text">Muat pesan sebelumnya</div>
                            </button>
                        )}
                        {chats.map((chat, index) => (
                            <div className="chat" key={index} data-chat-id={chat.id}
                                data-is-me={chat.sender.machineId === machineId}
                            >
                                <div className="header">
                                    <div className="sender">
                                        {chat.sender.machineId !== machineId && (
                                            <div className="flex" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                {chat.sender.role.specialRole && (
                                                    <div className="special-role">
                                                        <Tooltip title={chat.sender.role.name}>
                                                            <VerifiedIcon className='icon' style={{
                                                                color: "#fff",
                                                                fontSize: '15px'
                                                            }} />
                                                        </Tooltip>
                                                    </div>
                                                )}
                                                <Badge dot={chat.sender.online} color='green'>
                                                    <img src={chat.sender.avatar}
                                                        alt={chat.sender.name}
                                                        title={chat.sender.name}
                                                        className="avatar" />
                                                </Badge>

                                            </div>
                                        )}
                                        <div className="name">{chat.sender.name}</div>
                                        {chat.sender.machineId === machineId && (
                                            <div className="flex">
                                                <Badge dot={chat.sender.online} color='green'>
                                                    <img src={chat.sender.avatar}
                                                        alt={chat.sender.name}
                                                        title={chat.sender.name}
                                                        className="avatar" />
                                                </Badge>
                                                {chat.sender.role.specialRole && (
                                                    <div className="special-role">
                                                        <Tooltip title={chat.sender.role.name}>
                                                            <VerifiedIcon className='icon' />
                                                        </Tooltip>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="body">
                                    <div className="message">{chat.message}</div>
                                    {chat.hasAttachment && (
                                        <div className="attachments">
                                            {chat.attachments.map((attachment, index) => (
                                                <Attachment data={attachment} key={index} chat={chat} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="footer">
                                    <div className="sent">{chat.atStr}</div>
                                </div>
                            </div>
                        ))}
                        {!officeData.workingTime && (
                            <Tooltip title={officeData.helpMessage}>
                                <div className="outside-working-time">
                                    <div className="message">{officeData.message}</div>
                                </div>
                            </Tooltip>
                        )}
                        <TypingUsers users={typingUsers} />
                    </div>
                    <div className="footer-element">
                        <Input.TextArea
                            placeholder='Ketik sesuatu'
                            className='message-field'
                            autoSize={{
                                minRows: 3,
                                maxRows: 3
                            }}
                            value={message}
                            onChange={sender => setMessage(sender.target.value)}
                            disabled={!usernameUpdated || sending}
                        />
                        <div className="right-actions">
                            <Tooltip
                                title={attachment === null ? 'Max size: 10mb, allowed ext: jpg, jpeg, png, gif, mp4, xlsx, pdf.' : 'Hapus attachment'}
                            >
                                <button
                                    className='action-btn'
                                    disabled={!usernameUpdated || sending}
                                    onClick={() => {
                                        if (attachment === null) {
                                            fileInput.current.click()
                                        } else {
                                            setAttachment(null)
                                        }
                                    }}
                                    data-has-attachment={attachment !== null}
                                >
                                    <AttachmentIcon className='icon' />
                                </button>
                            </Tooltip>
                            <Tooltip title={socketConnected ? 'Kirim' : 'Gagal terhubung ke server'}>
                                <button
                                    disabled={!usernameUpdated || sending || !socketConnected}
                                    className='action-btn'
                                    onClick={handleUpdate}
                                >
                                    <SendIcon className='icon' />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}