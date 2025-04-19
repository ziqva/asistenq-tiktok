import {useEffect, useState} from 'react'
import './index.scss'
import {
    Spin
} from 'antd'
import deviceIsRegistered from 'utils/device/isRegistered'
import Error from './Error'
import ActivateLicense from './ActivateLicense'
import { useNavigate } from 'react-router-dom'

export default function Authentication() {
    const [loading, setLoading] = useState(false)
    const [registered, setRegistered] = useState(undefined)
    const [error, setError] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if(registered) window.location.href = '/'
    }, [registered])

    const refreshRegistered = () => {
        setLoading(true)
        deviceIsRegistered()
            .then((state) => {
                setRegistered(state)
                setLoading(false)
                setError(false)
            })
            .catch(err => {
                setRegistered(undefined)
                setError(err.message || err)
                setLoading(false)
            })
    }

    useEffect(() => {
        refreshRegistered()
    }, [])

    return (
        <div className='authentication page'>
            {typeof error === 'string' && <Error
                message={error} 
                onRefreshAuthenticated={refreshRegistered}
            />}
            {!registered && <ActivateLicense
                onRefreshAuthenticated={refreshRegistered}
                onError={err => setError(err)}
            />}
            <Spin spinning={loading} size='large' tip='Please wait...' fullscreen={true} />
        </div>
    )
}
