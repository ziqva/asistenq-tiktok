import { Modal } from "antd";

export default function Logs({ running, closeable, open, onClose, logs }) {
  return (
    <Modal
      title="Log(s)"
      destroyOnClose={true}
      closeIcon={undefined}
      visible={open}
      closable={closeable}
      onOk={onClose}
      onCancel={onClose}
      okButtonProps={{ disabled: running, loading: running }}
      cancelButtonProps={{ disabled: running }}
    >
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        <ul>
          {logs.map((log, _) => (
            <li key={_}>{log}</li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
