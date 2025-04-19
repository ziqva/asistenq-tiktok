import ButtonToggle from './ButtonToggle'
import { useState, useEffect } from 'react'
import Chat from './Chat'
import './live-chat.scss'
import Socket from 'utils/liveChat/Socket'
import getLastChat from 'utils/liveChat/getLastChat'
import loadOldChat from 'utils/liveChat/loadOldChat'
import showNotification from 'utils/notification/show'

const socket = new Socket()
let _chats = []
let _opened = false

export default function LiveChat({machineID}) {
    const [opened, setOpened] = useState(false)
    const [socketConnected, setSocketConnected] = useState(false)
    const [userId, setUserId] = useState(undefined)
    const [chats, setChats] = useState([])
    const [onlineUsers, setOnlineUsers] = useState([])
    const [typingUsers, setTypingUsers] = useState([])
    const [loadingOldestMessage, setLoadingOldestMessage] = useState(false)
    const [latestChatId, setLatestChatId] = useState(null)
    const [officeData, setOfficeData] = useState({
        workingTime: true,
        message: '',
        helpMessage: ''
    })

    useEffect(() => {
        _opened = opened
    }, [opened])


    useEffect(() => {
        _chats = chats
        if(chats.length > 0) {
            setLatestChatId(chats[chats.length - 1].id)
        }
    }, [chats])

    useEffect(() => {
        socket.onDisconnected = () => { setSocketConnected(false) }
        socket.onConnected = () => { setSocketConnected(true) }
        socket.onUserUpdate = ({userId, param, value}) => {
            let c = [..._chats]
            for(let i = 0; i < c.length; i++) {
                if(c[i].sender.id === userId) {
                    c[i].sender[param] = value
                }
            }
            setChats(c)
        }
        socket.onNewChat = data => { 
            setChats([..._chats, data])
            const senderMachineId = data.sender.machineId
            if(!_opened && senderMachineId !== machineID) {
                showNotification({
                    title: `LIVE CHAT | ${data.sender.name}`,
                    message: data.message,
                    from: 'live_chat-new-message'
                })
            }
         }  
        socket.onOnlineUsers = data => { setOnlineUsers(data) }
        socket.onTypingUsers = users => { setTypingUsers(users) }
        socket.onOfficeData = data => { setOfficeData(data) }
    }, [])  


    const fetchLatestChat = () => {
        getLastChat()
        .then((data) => {
            setChats([...chats, ...data])
        })
        .catch(err => console.error(`failed for get the last chat data: ${err.message || err}`))
    }

    useEffect(() => {
        if(typeof userId === 'string' && typeof machineID === 'string') {
            socket.connect({ machineId: machineID, userId: userId })
            fetchLatestChat()
        }
    }, [userId, machineID])

    useEffect(() => {
        if(typeof userId === 'string') {
            socket.setCurrentlyOpeningChat(opened)
        }
    }, [userId, opened])

    return (
        <div className="live-chat-container element">
            <Chat
                open={opened}
                onClose={() => setOpened(false)}
                machineId={machineID}
                socketConnected={socketConnected}
                onUserId={(userid) => setUserId(userid)}
                chats={chats}
                onlineUsers={onlineUsers}
                onTypingState={state => socket.setTypingState(state)}
                typingUsers={typingUsers}
                loadingOldestMessage={loadingOldestMessage}
                latestChatId={latestChatId}
                officeData={officeData}
                onLoadOldestMessage={() => {
                    if(chats.length > 0) {
                        const oldestChat = chats[0]
                        const oldestChatId = oldestChat.id
                        setLoadingOldestMessage(true)
                        loadOldChat({beforeChatId: oldestChatId})
                        .then((data) => {
                            setChats([...data, ...chats])
                            setLoadingOldestMessage(false)
                        })
                        .catch(err => {
                            console.error(err)
                            setLoadingOldestMessage(false)
                        })
                    }
                }}
            />
            <ButtonToggle 
                show={typeof machineID === 'string'}
                opened={opened}
                onToggle={() => setOpened(x => !x)}
            />
        </div>
    )
}