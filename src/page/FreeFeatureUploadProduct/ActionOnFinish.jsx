import {Radio, Space} from 'antd'

export default function ActionOnFinish({state, onStateChange}) {
    return (
        <div className="action-on-finish">
            <div className="name">Setelah Upload</div>
            <Radio.Group className='radio' value={state} onChange={sender => {
                onStateChange(sender.target.value)
            }}>
                <Space
                    direction='vertical'
                >
                    <Radio value='move'>Pindah file</Radio>
                    <Radio value='delete'>Hapus file</Radio>
                </Space>
            </Radio.Group>
        </div>
    )
}