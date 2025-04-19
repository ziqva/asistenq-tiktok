import {
    Button
} from 'antd'
import DeleteIcon from '@mui/icons-material/Delete'
import WarningIcon from '@mui/icons-material/Warning'
import { useEffect, useState } from 'react'
import authDelete from 'utils/free-feature/authenticator/remove'
import EditDialog from '../EditDialog'
import CreateIcon from '@mui/icons-material/Create';

export default function Action({data}) {
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    
    const handleDelete = () => {
        if(!deleteConfirm) {
            setDeleteConfirm(true)
        } else {
            setDeleteLoading(true)
            setDeleteConfirm(false)
            authDelete([data.id])
            .then(() => {
                setDeleteLoading(false)
                setDeleteConfirm(false)
            })
            .catch(err => {
                window.alert(err.message || err)
                setDeleteLoading(false)
                setDeleteConfirm(false)
            })
        }
    }

    return (
        <div className="cell-action">
            <EditDialog 
                open={editOpen}
                onClose={() => setEditOpen(false)}
                data={data}
            />
            <Button
                danger
                type='dashed'
                style={{
                    color: deleteConfirm ? 'orange' : ''
                }}
                onClick={handleDelete}
                loading={deleteLoading}
            >
                {deleteConfirm ? <WarningIcon /> : <DeleteIcon />}
            </Button>
            <Button
                type='dashed'
                style={{
                    color: 'var(--main-color)'
                }}
                onClick={() => setEditOpen(true)}
                disabled={editOpen}
            >
                <CreateIcon />
            </Button>
        </div>
    )
}