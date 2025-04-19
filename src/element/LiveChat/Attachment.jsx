import Tooltip from '@mui/material/Tooltip'
import FileIcon from '@mui/icons-material/InsertDriveFile';
import server from 'config/server'
import {
    Image
} from 'antd'
import { useEffect, useState } from 'react'

const imagesMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
]

export default function Attachment({ data, chat }) {
    const [isImage, setIsImage] = useState(false)
    const handleDownload = () => {
        const url = `${server.api.chat}/attachment/${chat.sender.id}/${chat.attachments[0].id}?as=${chat.attachments[0].filename}`
        window.location.href = url
    }

    useEffect(() => {
        const attachment = chat.attachments[0]
        if (attachment) {
            const mimetype = attachment.mimeType
            setIsImage(imagesMimeTypes.includes(mimetype))
        }
    }, [])

    return (
        <Tooltip
            title={`Unduh (${data.size.formatted})`}
        >
            {isImage && (
                <Image src={`${server.api.chat}/attachment/${chat.sender.id}/${chat.attachments[0].id}?as=${chat.attachments[0].filename}`}
                    preview={{
                        src: `${server.api.chat}/attachment/${chat.sender.id}/${chat.attachments[0].id}?as=${chat.attachments[0].filename}`
                    }}
                />
            )}

            {!isImage && (
                <div className="attachment" data-attachment-id={data.id}
                    onClick={handleDownload}
                >
                    <div className="filename">{data.filename}</div>
                    <FileIcon className='icon' />
                </div>
            )}
        </Tooltip>
    )
}