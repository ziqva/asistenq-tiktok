import { Button, Input, Modal, Alert } from "antd";
import { useEffect, useState } from "react";
import config from "config/server";
import axios from "axios";

export default function AddChat({ open, onClose, selected, onAdded }) {
  const [value, setValue] = useState("");

  const update = () => {
    const url = `${config.api.base}/templateChat/add/${selected}`;
    const params = {
      chat: value,
    };
    axios
      .post(url, params)
      .then(({ data }) => {
        if (data.error) {
          console.error(data.msg);
        } else {
          onAdded();
          onClose();
        }
      })
      .catch((er) => {
        console.error(er.message || er);
      });
  };

  useEffect(() => {
    setValue("");
  }, [open]);

  return (
    <Modal
      title="Tambah Chat"
      centered
      open={open}
      destroyOnClose
      onCancel={onClose}
      cancelText="Batal"
      okText="Simpan"
      onOk={update}
      okButtonProps={{
        disabled: value.length < 1 || value.length > 200,
      }}
    >
      <Input.TextArea
        showCount
        value={value}
        onChange={(sender) => setValue(sender.target.value)}
        minLength={1}
        maxLength={200}
        placeholder="Isi Chat"
        style={{
          marginBottom: "20px",
        }}
        status={value.length < 1 || value.length > 200 ? "error" : ""}
      />
    </Modal>
  );
}
