import ActiveIcon from '@mui/icons-material/TaskAlt';
import ModeratedIcon from '@mui/icons-material/HighlightOff';
import Tooltip from '@mui/material/Tooltip'

export default function Status({data, onClick}) {
    return (
        <div className="status-cell" onClick={() => onClick(data.id)}>
            <Tooltip title={data.moderated ? (
                <div style={{
                    whiteSpace: 'pre-line'
                }}>
                    {data.statusMessage}
                </div>
            ) : 'Aktif'}>
                <div>
                    {!data.moderated && <ActiveIcon className='icon green' />}
                    {data.moderated && <ModeratedIcon className='icon red' />}
                </div>
            </Tooltip>
        </div>
    )
}