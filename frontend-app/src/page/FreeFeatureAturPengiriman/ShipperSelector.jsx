import { CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import getShippers from 'utils/free-feature/shipping-manager/getShippers'
import ShipperItem from './ShipperItem'

export default function ShipperSelector({onChange}) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({})
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    onChange(selectedIds)
  }, [selectedIds])

  const handleSelectToggle = (id) => {
    let x = [...selectedIds]
    if(x.includes(id)){
      x = x.filter(y => y !== id)
    } else {
      x.push(id)
    }
    setSelectedIds(x)
  }

  useEffect(() => {
    getShippers()
    .then(data => {
      setData(data)
      console.log(data)
    })
    .catch(err => {
      console.error(err.message || err)
    })
    .finally(() => setLoading(false))
  }, [])

  if(loading) {
    return (
      <CircularProgress className='loading-spinner' />
    )
  }

  return (
    <div className="shipper-selector">
      <div className="shippers-container">
        <div className="title">Di-pickup kurir</div>
        <div className="description">Kurir akan menjemput paket di alamat Penjual untuk diantar ke Pembeli.</div>
        <div className="items">
          {data.ondemand.map((shipper, i) => (
            <ShipperItem key={i} data={shipper}
              selecteds={selectedIds}
              onSelectToggle={handleSelectToggle} 
            />
          ))}
        </div>
      </div>
      <div className="shippers-container">
        <div className="title">Drop off ke gerai</div>
        <div className="description">Kurir akan menjemput paket di alamat Penjual untuk diantar ke Pembeli.</div>
        <div className="items">
        {data.conventional.map((shipper, i) => (
            <ShipperItem key={i} data={shipper} 
              selecteds={selectedIds}
              onSelectToggle={handleSelectToggle} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}
  