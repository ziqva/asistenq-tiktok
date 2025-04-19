import { Tooltip } from '@mui/material'
import help from 'static/icon/help.png'
import icon from '../../static/icon/chrome-ext.png'
import {
    Button,
    Divider,
    Input
} from 'antd'
import { useEffect, useState } from 'react'
import getExtensions from 'utils/browser/getExtensions'
import addExt from 'utils/browser/addExt'
import DeleteIcon from '@mui/icons-material/Delete';
import removeExtension from 'utils/browser/removeExtension'


export default function ChromeExtension() {
    const [extensions, setExtensions] = useState([])
    const [addUrl, setAddUrl] = useState('')
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setError(false)
    }, [addUrl])

    const refreshExtensions = () => {
        getExtensions() 
            .then(res => {
                setExtensions(res)
            })
            .catch(console.error)
    }

    useEffect(() => {
        refreshExtensions()
    }, [])

    const add = () => {
        setLoading(true)
        addExt(addUrl)
        .then(() => {
            setError(false)
            refreshExtensions()
        })
        .catch(err => setError(err.message || err))
        .finally(() => setLoading(false))
    }

    const deleteExt = id => {
        removeExtension(id)
        .then(() => {
            refreshExtensions()
        })
        .catch(err => setError(err.message || err))
    }

    return (    
        <div className="setting setting-chrome-ext">
            <div className="setting-title">
                <img className="icon"
                    alt=''
                    src={icon}
                    draggable={false}
                />
                <div className="text">Kelola Ekstensi Chrome</div>
            </div>
            <div className="content">
                <div className="add-form">
                    <Input placeholder='https://chromewebstore.google.com/detail/****' 
                        value={addUrl}
                        onChange={s => setAddUrl(s.target.value)}
                    />
                    <Button 
                        type='primary'
                        onClick={add}
                        disabled={loading}
                        loading={loading}
                    >Add</Button>
                </div>
                {typeof error === 'string' && (
                    <div className="error-msg">{error}</div>
                )}

                {extensions.length > 0 && (
                    <>
                        <Divider />
                        <table className='ext-table'>
                            <tbody>
                                {extensions.map((extension, i) => (
                                    <tr key={i} className='ext-list'>
                                        <td>
                                            <img alt={extension.name} title={extensions.name} src={extension.iconUrl} draggable={false} className='icon' />
                                        </td>
                                        <td className='name-container'>
                                            <div className="name">{extension.name}</div>
                                            <button className='delete-btn' onClick={() => {
                                                deleteExt(extension.id)
                                            }}>
                                                <DeleteIcon />
                                            </button>
                                        </td>
                                        
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    )
}