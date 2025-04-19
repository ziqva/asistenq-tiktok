import {
    Table,
    Empty,
    Checkbox
} from 'antd'
import CellOtp from './Cell/Otp'
import CellAccount from './Cell/Account'
import CellAction from './Cell/Action'
import { useEffect, useState } from 'react'
import ActionHeader from './ActionHeader'
import authDelete from 'utils/free-feature/authenticator/remove'

export default function DataGrid({data, onSelectedToggle, selectedCount, onSelectedChange, selected}) {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth)
    const [windowHeight, setWindowHeight] = useState(window.innerHeight)
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => {
        window.addEventListener('resize', () => {
            setWindowWidth(window.innerWidth)
            setWindowHeight(window.innerHeight)
        })
    }, [])

    const handleSelectedToggle = (id, target) => {
        onSelectedToggle(id, target)
    }

    const columns = [
        {
            title: <Checkbox
                checked={selectedCount >= data.length}
                indeterminate={selectedCount > 0 && selectedCount < data.length}
                onChange={(sender) => {
                    if(sender.target.checked) {
                        onSelectedChange(data.map(x => x.id))
                    } else {
                        onSelectedChange([])
                    }
                }}
            />,
            fixed: "left",
            width: 40,
            render: data => <Checkbox
                checked={data.selected}
                onChange={(sender) => handleSelectedToggle(data.id, sender.target.checked)}
            />
        },
        {
            title: "OTP",
            fixed: 'left',
            render: data => <CellOtp data={data} />,
            width: 90
        },
        {
            title: "Akun",
            render: data => <CellAccount data={data} />
        },
        {
            title: <ActionHeader 
                deleteLoading={deleteLoading}
                selectedCount={selectedCount}
                onDelete={() => {
                    setDeleteLoading(true)
                    authDelete(selected)
                    .then(() => {
                        setDeleteLoading(false) 
                        onSelectedChange([])
                    })
                }}
            />,
            render: data => <CellAction data={data} />,
            width: 150
        }
    ]

    if(data.length < 1) {
        return (
            <Empty 
                className='empty-wrapper'
                description='Tidak ada data apapun disini'
            />
        )
    } else {
        return (
            <div className="data-grid-container">
                <Table
                    columns={columns}
                    dataSource={data}
                    scroll={{
                        y: windowHeight - 320
                    }}
                />
            </div>
        )
    }
}