import { Typography, Card, Button, Popconfirm } from "antd";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import config from "config/server";

export default function ChatItem({ selected, chat, onUpdate, ...args }) {
  const remove = () => {
    const url = `${config.api.base}/templateChat/remove/${selected}`;
    const params = { chat };
    axios
      .post(url, params)
      .then(() => {
        onUpdate && onUpdate();
      })
      .catch((err) => {});
  };

  return (
    <Card className="chat-item" size="small" {...args}>
      <div className="head">
        <Popconfirm
          title="Konfirmasi"
          description="Anda yakin ingin menghapus chat ini secara permanen ?"
          onConfirm={remove}
        >
          <Button
            icon={<DeleteIcon />}
            danger
            size="small"
            type="text"
            className="delete-btn"
          ></Button>
        </Popconfirm>
      </div>
      <Typography className="chat">{chat}</Typography>
    </Card>
  );
}
