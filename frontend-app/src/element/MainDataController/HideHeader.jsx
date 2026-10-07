import {
    Checkbox
} from 'antd'

export default function HideHeader({useSelection, onToggle, active}) {
    return (
        <div className="hide-header" style={{
            left: useSelection ? '240px' : '130px'
        }}>
            <Checkbox
                checked={active}
                onChange={onToggle}
            >Hide Header</Checkbox>
        </div>
    )
}