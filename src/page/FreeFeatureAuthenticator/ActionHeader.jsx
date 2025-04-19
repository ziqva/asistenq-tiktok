import {
   Button,
   Popconfirm
} from 'antd'
import DeleteIcon from '@mui/icons-material/Delete'

export default function ActionHeader({selectedCount, onDelete, deleteLoading}) {
   return (
      <div className="action-header" style={{
         opacity: selectedCount < 1 ? 0 : 1
      }}>
         <Popconfirm
            title='Konfirmasi'
            okType='danger'
            okText='Hapus'
            cancelText='Batal'
            description={`Apakah anda yakin ingin menghapus ${selectedCount} data authenticator secara permanen ?`}
            onConfirm={onDelete}
         >
            <Button
               className='action-item'
               danger
               loading={deleteLoading}
               type='dashed'
               icon={<DeleteIcon />}
               disabled={selectedCount<1}
            />
         </Popconfirm>
      </div>
   )
}