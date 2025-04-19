import MopedIcon from '@mui/icons-material/Moped';
import Tooltip from '@mui/material/Tooltip'

export default function Ongkir({data, onClick}) {
    return (
        <div className="ongkir-cell" onClick={() => onClick(data.id)}>
            <Tooltip title={data.freeOngkir ? 'Aktif' : 'Nonaktif'}>
                <MopedIcon 
                    className='icon'
                    style={{
                        color: data.freeOngkir ? 'green' : 'rgba(0,0,0,0.3)',
                    }}
                />
            </Tooltip>
        </div>
    )
}