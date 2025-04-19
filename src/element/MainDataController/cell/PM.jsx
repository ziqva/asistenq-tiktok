import Tooltip from '@mui/material/Tooltip'
import { Badge } from 'antd'
import pmDisabled from 'static/icon/powerMerchantDisabled.png'

export default function PM({data, onClick}) {
    return (
        <div className="pm-cell" onClick={() => onClick(data.id)}>
            <Tooltip title={`${data.pmName}${data.pmRevoked === 1 ? ' (Belum Verifikasi)' : ''}`}>
                <Badge count={data.pmRevoked} dot={true}>
                    <img 
                        className='img'
                        src={data.pmImage.length > 0 ? data.pmImage : pmDisabled}
                        alt='Power Merchant Status'
                    />
                </Badge>
            </Tooltip>
        </div>
    )
}