import { Modal, Typography } from "antd";

export default function UpdateNotice({ open, onClose }) {
  return (
    <Modal
      visible={open}
      onCancel={onClose}
      onOk={onClose}
      className="update-notice"
      title="Notification"
    >
      <Typography>
        Pengecekan update akan dicek dibelakang layar, anda akan menerima
        notifikasi -+10 menit jika terdapat update
      </Typography>
    </Modal>
  );
}
