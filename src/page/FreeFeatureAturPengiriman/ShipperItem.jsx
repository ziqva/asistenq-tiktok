import {
    Checkbox
} from 'antd'

export default function ShipperItem({ data, selecteds, onSelectToggle }) {

    return (
        <div className="shipper-item">
            <div className="flex">
                {/* <Checkbox /> */}
                {data.image !== "" && (
                    <img src={data.image} alt={data.shipper_name} title={data.shipper_name} className='shipper_icon' />
                )}
                <div className="right-i">
                    <div className="name">{data.shipper_name}</div>
                    {data.is_whitelabel && (
                        <div className='description'>{data.shipper_product[0].shipper_product_desc}</div>
                    )}

                    {!data.is_whitelabel && (
                        <div className='description'>{data.shipper_product.map(x => x.shipper_product_name).join(' | ')}</div>
                    )}
                </div>
            </div>
            <hr />
            <div className="sub_items">
                {data.shipper_product.map((sp,i) => (
                    <div className='subitem_list' key={i}>
                        <Checkbox 
                            checked={(selecteds || []).includes(sp.shipper_product_id)}
                            onChange={() => onSelectToggle(sp.shipper_product_id)}
                        />
                        <div className="name">{sp.shipper_product_name}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}