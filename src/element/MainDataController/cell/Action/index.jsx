import { IconButton, Menu, MenuItem } from "@mui/material";
import Icon from "@mui/icons-material/MoreVert";
import { useEffect, useState } from "react";
import accountLogin from "utils/main/account/login";
import accountRefresh from "utils/main/account/refresh";
import accountRemove from "utils/main/account/remove";
import { Popconfirm, Divider, Modal, Typography } from "antd";
import axios from 'axios'
import server from "config/server";

export default function Action({ data, onEdit }) {
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null)

  const handlePin = () => {
    const url = `${server.api.base}/monitoring/pin`
    axios.post(url, {
      id: data.id
    }).then(({data}) => {
      if(data.error) {
        setErrorMsg(data.msg)
      }
    }).catch(err => setErrorMsg(err.message || err))
    .finally(() => setOpen(false))
  }

  return (
    <div className="action-cell">
      <Modal 
        open={typeof errorMsg === 'string'}
        onClose={() => setErrorMsg(null)}
        centered
        title='Warning'
        width={350}
        onCancel={() => setErrorMsg(null)}
        onOk={() => setErrorMsg(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
      ><Typography>{errorMsg}</Typography></Modal>
      <IconButton
        className="toggle-btn"
        onClick={(sender) => setOpen(sender.currentTarget)}
        size="small"
      >
        <Icon className="icon" fontSize="small" />
      </IconButton>

      <Menu open={Boolean(open)} anchorEl={open} onClose={() => setOpen(false)}>
        {/* Refresh */}
        <MenuItem
          onClick={() => {
            accountRefresh(data.id)
              .then(() => {
                setOpen(false);
              })
              .catch((err) => {
                window.alert(err.message || err);
                setOpen(false);
              });
          }}
        >
          Refresh
        </MenuItem>
        {/* End of refresh */}

        {/* Login */}
        <MenuItem
          onClick={() => {
            accountLogin({ ids: [data.id] })
              .then(() => {})
              .catch((err) => {
                console.error("login failed: ", err);
              });
            setOpen(false);
          }}
        >
          Login
        </MenuItem>
        {/* End of login */}
        {/* Update */}
        <MenuItem
          onClick={() => {
            onEdit && onEdit(data.id);
            setOpen(false);
          }}
        >
          Edit
        </MenuItem>
        {/* End of update */}
        {/* Hapus */}
        <Popconfirm
          style={{
            zIndex: 1000000,
          }}
          overlayStyle={{
            zIndex: 10000000,
          }}
          overlayInnerStyle={{
            zIndex: 10000000,
          }}
          title="Konfirmasi"
          description={`Apakah anda yakin ingin menghapus akun ${data.name} ?`}
          onCancel={() => {
            setOpen(false);
          }}
          onConfirm={() => {
            return new Promise((resolve) => {
              accountRemove([data.id])
                .then(() => {
                  resolve();
                  setOpen(false);
                })
                .catch((err) => {
                  window.alert(err.message || err);
                  resolve();
                  setOpen(false);
                });
            });
          }}
        >
          <MenuItem>Hapus</MenuItem>
        </Popconfirm>
        <MenuItem
          onClick={handlePin}
        >{data.pinned === 0 ? 'Pin' : 'Un-Pin'}</MenuItem>
        {/* <Divider
          style={{
            background: "#000",
            marginTop: 0,
            marginBottom: 0,
          }}
        /> */}
        {/* End of hapus */}
        {/* Hapus produk */}
        {/* <MenuItem
          onClick={() =>
            window.open(`/free-feature/delete-product/${data.id}`, "_blank")
          }
        >
          Delete Product
        </MenuItem> */}
        {/* End of hapus produk */}
        {/* Product uploader */}
        {/* <MenuItem
          onClick={() =>
            window.open(`/free-feature/product-uploader/${data.id}`, "_blank")
          }
        >
          Upload Product
        </MenuItem> */}
        {/* End of product uploader */}
      </Menu>
    </div>
  );
}
