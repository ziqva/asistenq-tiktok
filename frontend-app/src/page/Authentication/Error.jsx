import {
    Button
} from 'antd'

export default function Error({message, onRefreshAuthenticated}) {
    return (
        <div className='error-element'>
            <div className="message">{message}</div>
            <Button
                className='refresh-btn'
                onClick={onRefreshAuthenticated}
                danger
                type='primary'
            >Refresh</Button>
        </div>
    )
}