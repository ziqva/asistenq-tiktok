import accountsIcon from "static/icon/accounts.png";
import alreadyLoginIcon from "static/icon/verified-account.png";
import hasSaldoIcon from "static/icon/money.png";
import moderasiIcon from "static/icon/banned.png";
import logoutIcon from "static/icon/logout.png";
import loginIcon from "static/icon/login.png";
import settingIcon from "static/icon/setting.png";
import aboutIcon from "static/icon/about.png";
import logout2icon from "static/icon/logout2.png";
import { Divider, Popconfirm, Spin } from "antd";
import { useEffect, useState } from "react";
import SettingDialog from "element/SettingDialog";
import removeIcon from "static/icon/remove.png";
import accountRemove from "utils/main/account/remove";
import accountLogin from "utils/main/account/login";
import AboutDialog from "element/AboutDialog";
import forceLogoutAllDevice from "utils/account/forceLogoutAllDevice";
import checkForUpdateIcon from "static/icon/check-for-update.png";
import processingBox from 'static/icon/processing-box.png'
import refreshIcon from 'static/icon/refresh.png'

import checkUpdate from "utils/update/check";
import UpdateNotice from "./UpdateNotice";
import formatWaktuRelatif from "utils/formatWaktuRelatif";
import MarkProcessedOrderDialog from "./MarkProcessedOrderDialog";
import bulkRefreshCore from "utils/monitoring/bulkRefresh";
import { message, Progress } from 'antd'

let remainingInterval;

export default function FilterButton({
  active,
  onActiveChange,
  data,
  useSelection,
  selectedIds,
  onDeleted,
  refreshData
}) {
  const [settingOpen, setSettingOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [checkForUpdateRemaining, setCheckForUpdateRemaining] = useState(0);
  const [forceLogoutAllDeviceLoading, setForceLogoutAllDeviceLoading] =
    useState(false);
  const [updateNoticeShow, setUpdateNoticeShow] = useState(false);
  const [MarkProcessedOrderOpen, setMarkProcessedOrderOpen] = useState(false)


  useEffect(() => {
    console.log(refreshData)
  }, [refreshData])

  const handleDelete = () => {
    return new Promise((resolve, reject) => {
      accountRemove(selectedIds)
        .then(() => {
          resolve();
          onDeleted && onDeleted();
        })
        .catch((err) => {
          window.alert(err.message || err);
          resolve();
        });
    });
  };

  const handleCheckForUpdate = () => {
    setCheckForUpdateRemaining(1);
    checkUpdate().then(() => {
      setCheckForUpdateRemaining(420);
      setUpdateNoticeShow(true);
      if (remainingInterval) clearInterval(remainingInterval);
      remainingInterval = setInterval(() => {
        setCheckForUpdateRemaining((x) => x - 1);
      }, 1000);
    });
  };

  const bulkRefresh = () => {
    console.log('Bulk refresh clicked')
    bulkRefreshCore(selectedIds)
      .catch(err => message.error(err.message || err))
  }

  return (
    <div className="filter-button">
      <MarkProcessedOrderDialog open={MarkProcessedOrderOpen} onClose={() => setMarkProcessedOrderOpen(false)} />
      <UpdateNotice
        open={updateNoticeShow}
        onClose={() => setUpdateNoticeShow(false)}
      />
      <SettingDialog open={settingOpen} onClose={() => setSettingOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      {(data.mainCount || 0) !== (data.allAccountCount || 0) && (
        <Button
          data-aos="fade-up"
          data-aos-delay={900}
          count={data.allAccountCount || 0}
          icon={accountsIcon}
          active={active === null}
          onClick={() => onActiveChange(null)}
        >
          Semua Akun
        </Button>
      )}
      {/* {(data.logoutCount || 0) === 0 && ( */}
      <Button
        data-aos="fade-up"
        data-aos-delay={1000}
        count={data.mainCount || 0}
        icon={alreadyLoginIcon}
        active={active === "active"}
        onClick={() => onActiveChange("active")}
      >
        Akun Aktif
      </Button>
      {/* )} */}
      {/* Sudah login */}
      {/* <Button
        count={data.loggedinCount || 0}
        icon={alreadyLoginIcon}
        active={active === "loggedin"}
        onClick={() => onActiveChange("loggedin")}
      >
        Akun Aktif
      </Button> */}
      {/* End of sudah login */}
      <Button
        data-aos="fade-up"
        data-aos-delay={1100}
        count={data.hasSaldoCount || 0}
        icon={hasSaldoIcon}
        active={active === "has_saldo"}
        onClick={() => onActiveChange("has_saldo")}
      >
        Akun Bersaldo
      </Button>
      {/* <Button
        data-aos="fade-up"
        data-aos-delay={1200}
        count={data.moderatedCount || 0}
        icon={moderasiIcon}
        active={active === "moderasi"}
        onClick={() => onActiveChange("moderasi")}
      >
        Moderasi
      </Button> */}
      <Button
        data-aos="fade-up"
        data-aos-delay={1300}
        count={data.logoutCount || 0}
        icon={logoutIcon}
        active={active === "logout"}
        onClick={() => onActiveChange("logout")}
      >
        Logout
      </Button>

      {useSelection && (
        <>
          <div className="divider-container">
            <Divider className="divider" size="small">
              Aksi Massal
            </Divider>
          </div>
          {/*Login*/}
          <Button
            count={selectedIds.length}
            disabled={selectedIds.length <= 0}
            icon={loginIcon}
            onClick={(sender) => {
              accountLogin({ ids: selectedIds });
            }}
          >
            Login
          </Button>
          {/*    End of login*/}
          {/*    Hapus*/}
          <Popconfirm
            title={`Hapus massal`}
            description={`Anda yakin ingin menghapus ${selectedIds.length} akun secara permanen ?`}
            okText="Hapus"
            cancelText="Batal"
            onConfirm={handleDelete}
          >
            <Button
              count={selectedIds.length}
              disabled={selectedIds.length <= 0}
              icon={removeIcon}
            >
              Hapus
            </Button>
          </Popconfirm>
          {!refreshData.running && (
            <Button
              icon={refreshIcon}
              count={selectedIds.length}
              disabled={selectedIds.length < 1 || refreshData.running}
              onClick={bulkRefresh}
            >Refresh Massal</Button>
          )}
          {refreshData.running && (
            <div className="refresh-card-container">
              <Progress percent={refreshData.progress.percentage}
                status='active'
                strokeColor={{ from: '#108ee9', to: '#87d068' }}
                format={() => ''}
                className="progress-bar"
              />
              <div className="foot">
                <Spin size='small' className="spin-bar" />
                <div className="text">Refreshing data ...</div>
                <div className="text right">{refreshData.progress.processed}/{refreshData.progress.total}</div>
              </div>
            </div>
          )}
          {/*    End of hapus*/}
          {/*    Force logout all device (keluar semua perangkat)*/}
          {/*    <Popconfirm*/}
          {/*        title='Keluar semua perangkat'*/}
          {/*        description={`Anda yakin ingin mengeluakan semua perangkat dari ${selectedIds.length} akun kecuali perangkat saat ini ?`}*/}
          {/*        okText='Lanjutkan'*/}
          {/*        cancelText='Batal'*/}
          {/*        onConfirm={() => {*/}
          {/*            setForceLogoutAllDeviceLoading(true)*/}
          {/*            forceLogoutAllDevice(selectedIds)*/}
          {/*                .then(() => {*/}
          {/*                    onDeleted()*/}
          {/*                    setForceLogoutAllDeviceLoading(false)*/}
          {/*                })*/}
          {/*                .catch(err => {*/}
          {/*                    console.error(err.message || err)*/}
          {/*                    onDeleted()*/}
          {/*                    setForceLogoutAllDeviceLoading(false)*/}
          {/*                })*/}
          {/*        }}*/}
          {/*    >*/}
          {/*        <Button*/}
          {/*            count={selectedIds.length}*/}
          {/*            disabled={selectedIds.length < 1 || forceLogoutAllDeviceLoading}*/}
          {/*            icon={logout2icon}*/}
          {/*        >Keluar semua perangkat</Button>*/}
          {/*    </Popconfirm>*/}
          {/*    End of force logout all device*/}
        </>
      )}
      <div className="divider-container">
        <Divider className="divider" />
      </div>
      {/* <Button count={0}
        icon={processingBox}
        disabled={MarkProcessedOrderOpen}
        onClick={() => setMarkProcessedOrderOpen((x) => !x)}
      >
        Tandai Pesanan Dikemas
      </Button> */}
      <Button
        count={0}
        icon={settingIcon}
        disabled={settingOpen}
        onClick={() => setSettingOpen((x) => !x)}
      >
        Pengaturan
      </Button>
      <Button
        count={0}
        icon={aboutIcon}
        disabled={aboutOpen}
        onClick={() => setAboutOpen((x) => !x)}
      >
        About
      </Button>
      <Button
        count={0}
        icon={checkForUpdateIcon}
        disabled={checkForUpdateRemaining > 0}
        onClick={handleCheckForUpdate}
      >
        {checkForUpdateRemaining > 0
          ? `${formatWaktuRelatif(checkForUpdateRemaining)} lagi`
          : "Cek Update"}
      </Button>
    </div>
  );
}

function Button({ children, count, icon, active, onClick, disabled, ...args }) {
  return (
    <button
      {...args}
      className="button"
      data-active={active ? "1" : "0"}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="container">
        <img
          src={icon}
          alt={children}
          aria-disabled={disabled}
          className="icon"
          draggable={false}
        />
        <div className="text">{children}</div>
        {count > 0 && <div className="count">{count}</div>}
      </div>
    </button>
  );
}
