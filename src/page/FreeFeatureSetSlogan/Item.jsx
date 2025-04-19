import { useEffect, useState } from "react";
import { Badge, Empty, Modal, Input, Button } from "antd";
import { DeleteOutline } from "@mui/icons-material";
import axios from "axios";
import server from "config/server";

export default function Item({
  title,
  min,
  error,
  disabled,
  data,
  max,
  name,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNewValue(data);
    } else {
      setNewValue([]);
    }
  }, [open]);

  const update = () => {
    setLoading(true);
    const url = `${server.api.base}/free-feature/slogan/update?name=${name}`;
    const params = {
      values: newValue.map((x) => x.trim()).filter((x) => x.length > 0),
    };
    axios
      .post(url, params)
      .then(({ data }) => {
        setLoading(false);
        if (data.error) {
          console.error(data.msg);
        } else {
          onChange && onChange();
          setOpen(false);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error(err.message || err);
      });
  };

  return (
    <>
      <Modal
        title={`Ubah ${title}`}
        destroyOnClose={true}
        visible={open}
        closable={!loading}
        onCancel={() => setOpen(false)}
        okButtonProps={{
          loading: loading,
          disabled:
            loading || [...newValue].findIndex((x) => x.trim().length < 1) >= 0,
        }}
        onOk={update}
        cancelButtonProps={{
          disabled: loading,
        }}
      >
        <div className="slogan-item-modal">
          <div className="item-slogan-modal-container">
            {newValue.map((value, _) => (
              <div className="item" key={_}>
                <Input.TextArea
                  key={_}
                  disabled={loading}
                  value={newValue[_]}
                  maxLength={max}
                  onChange={(sender) => {
                    const newValues = [...newValue];
                    newValues[_] = sender.target.value;
                    setNewValue(newValues);
                  }}
                  status={value.trim().length < 1 ? "error" : undefined}
                  count={{
                    show: true,
                    max: max,
                  }}
                />
                <Button
                  type="text"
                  danger
                  loading={loading}
                  icon={<DeleteOutline />}
                  onClick={() => {
                    setNewValue((x) => [...x].filter((x, i) => i !== _));
                  }}
                ></Button>
              </div>
            ))}
          </div>
          <Button
            type="primary"
            style={{ textAlign: "center" }}
            onClick={() => setNewValue((x) => [...x, ""])}
            disabled={
              [...newValue].findIndex((x) => x.trim().length < 1) >= 0 ||
              loading
            }
          >
            Tambah
          </Button>
        </div>
      </Modal>
      <Badge.Ribbon
        text={title}
        placement="start"
        className="rib"
        color={error || data.length < 1 || data.length < min ? "red" : "blue"}
      >
        <div
          className="item-container"
          title="Slogan"
          id={`${title}-${min}`}
          data-error={error || data.length < 1 || data.length < min ? "1" : "0"}
          onClick={() => setOpen(true)}
        >
          {data.length < 1 && (
            <Empty
              description={`Whoops, ketuk disini untuk menambahkan ${title}`}
            />
          )}
          {data.length > 0 && (
            <div className="items-preview">
              <ul>
                {data.map((item, _) => (
                  <li key={_}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Badge.Ribbon>
    </>
  );
}
