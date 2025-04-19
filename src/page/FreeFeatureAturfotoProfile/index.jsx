import FreeFeatureHeader from "element/FreeFeatureHeader";
import { useEffect, useState } from "react";
import "./index.scss";
import {
  Button,
  Popconfirm,
  Typography,
  Alert,
} from "antd";
import SelectAccount from "./SelectAccount";
import WrapperSelectOne from "./WrapperSelectOne";
import MainData from "utils/free-feature/aturFotoProfil/MainData";
import Logs from "./Logs";
import Item from "./Item";
import axios from "axios";
import server from "config/server";
import { Snackbar, IconButton } from '@mui/material'
import React from 'react'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const md = new MainData();


export default function FreeFeatureAturFotoProfile() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [logShow, setLogShow] = useState(false);
  const [folder, setFolder] = useState(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [listData, setListData] = useState([]) // file, accountid


  const fetchListData = () => {
    const url = `${server.api.base}/freeFeature/aturFotoProfil/listData`
    axios
      .post(url, { selectedIds, folder })
      .then(({ data }) => {
        if (data.error) {
          notice(data.msg)
          setFolder(null)
        } else {
          setListData(data.data)
        }
      })
      .catch((err) => {
        notice(err.message)
        setFolder(null)
      });
  }

  useEffect(() => {
    if (folder && selectedIds.length > 0) {
      fetchListData()
    } else {
      setListData([])
    }
  }, [folder, selectedIds])


  const notice = msg => {
    setSnackbarMsg(msg)
    setSnackbarOpen(true)
  }

  const selectFolder = () => {
    const url = `${server.api.base}/freeFeature/aturFotoProfil/selectFolder`;
    axios
      .get(url, {
        timeout: 100000000, 
        timeoutErrorMessage: "Terlalu lama menunggu folder terpilih",
      })
      .then(({ data }) => {
        if (data.error) {
          notice(data.msg)
        } else {
          setFolder(data.data)
        }
      })
      .catch((err) => {
        notice(err.message)
      });
  }


  useEffect(() => {
    document.title = "Free Feature | Atur Foto Profil";
    md.onLogs = (logs) => setLogs(logs);
    md.onRunningState = (state) => {
      setRunning(state)
    };
  }, []);

  useEffect(() => {
    if (running) {
      setLogShow(true);
    }
  }, [running]);

  const process = () => {
    setRunning(true)
    setLogs([]);
    md.start(selectedIds, {
      folder: folder
    });
  }

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={15000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
      />
      <FreeFeatureHeader title="Free Tools - Atur Foto Profil" canBack={true} selectedIds={selectedIds} />
      <Logs
        open={logShow}
        logs={logs}
        closeable={!running}
        onClose={() => {
          if (!running) {
            setLogShow(false);
          }
        }}
      />
      <div className="free-feature-set-slogan page">
        <div className="main">
          <div className="left-side">
            <SelectAccount onSelectedChange={(ids) => setSelectedIds(ids)} />
          </div>
          <div className="the-right-side">
            <Typography className="main-title">Atur Foto Profil</Typography>
            <Alert
              message="Foto akan diacak sesuai didalam folder yang anda pilih"
              type="info"
              showIcon
            />
            {selectedIds.length < 1 && <WrapperSelectOne />}
            {listData.length > 0 && (
              <Alert type='warning' message={`${listData.length} akun akan diubah foto profilnya, aksi tidak akan bisa dibatalkan kecuali browser ditutup secara paksa. Pastikan Anda sudah yakin ketika memulainya`} showIcon />
            )}

            <div className="actions">
              <Button type="primary" onClick={selectFolder}>{folder ? 'Ubah Folder' : 'Pilih Folder'}</Button>
              {/* <Popconfirm
                title="Konfirmasi"
                arrow={false}
                description="Anda yakin ingin melanjutkan ?"
                showArrow={false}
                cancelText="Batal"
                okText="Terapkan"
                okButtonProps={{
                  danger: true,
                }} */}
              {/* onConfirm={() => {
                  setLogs([]);
                  md.start(selectedIds, {
                    // descriptions: data.descriptions,
                    // slogans: data.slogans,
                  });
                }} */}
              {/* > */}
              <Button type="primary" danger disabled={selectedIds.length < 1 || running || folder === null}
                onClick={process}>
                Terapkan ({selectedIds.length})
              </Button>
              {/* </Popconfirm> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
