import {
    Checkbox,
    Button
} from 'antd'

export default function SelectionCheckState({active, onActiveChange, onSelectAll}) {
    return (
        <div className="selection-check-state">
            <Checkbox
                checked={active}
                onChange={sender => onActiveChange(sender.target.checked)}
            >Tandai akun</Checkbox>
            {active && <Button size='small' type='link' onClick={onSelectAll}>Tandai Semua</Button>}
        </div>
    )
}