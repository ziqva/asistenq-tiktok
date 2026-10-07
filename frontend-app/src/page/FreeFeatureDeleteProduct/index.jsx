import FreeFeatureHeader from "element/FreeFeatureHeader";
import "./index.scss";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import MainData from "utils/free-feature/deleteProduct/MainData";
import getAccount from "utils/free-feature/deleteProduct/getAccount";
import { Button } from "antd";
import Sort from "./Sort";

let md;

const sortData = [
  {
    name: "Terakhir Diubah",
    params: { id: "UPDATE_TIME", value: "DESC" },
  },
  {
    name: "Terlaris",
    params: { id: "SOLD", value: "DESC" },
  },
  {
    name: "Kurang Diminati",
    params: { id: "SOLD", value: "ASC" },
  },
  {
    name: "Harga Tertinggi",
    params: { id: "PRICE", value: "DESC" },
  },
  {
    name: "Harga Terendah",
    params: { id: "PRICE", value: "ASC" },
  },
  {
    name: "Nama: A - Z",
    params: { id: "NAME", value: "ASC" },
  },
  {
    name: "Nama: Z - A",
    params: { id: "NAME", value: "DESC" },
  },
  {
    name: "Stock Terbanyak",
    params: { id: "STOCK", value: "DESC" },
  },
  {
    name: "Stock Tersedikit",
    params: { id: "STOCK", value: "ASC" },
  },
];

export default function DeleteProduct() {
  const [running, setRunning] = useState(false);
  const params = useParams();
  const [account, setAccount] = useState(null);
  const [logs, setLogs] = useState([]);
  const [eligible, setEligible] = useState(undefined);
  const floatingRef = useRef(null);
  const [floatingSize, setFloatingSize] = useState(0);
  const [sort, setSort] = useState(null);
  const [notSold, setNotSold] = useState(false)

  useEffect(() => {
    if(notSold) {
      setSort({
          name: "-",
          params: { id: "SOLD", value: "ASC" },
      })
    }
  }, [notSold])

  useEffect(() => {
    md = new MainData({
      onLogs: (logs) => setLogs(logs),
      onRunningState: (state) => setRunning(state),
      onEligible: (data) => {
        setEligible(data);
      },
    });
    getAccount(params.accountId)
      .then((data) => {
        setAccount(data);
      })
      .catch((err) => console.error(err.message || err));
    document.title = "Free Feature | Hapus Produk";
  }, []);

  useEffect(() => {
    if (floatingRef.current) {
      const width = floatingRef.current.offsetWidth;
      setFloatingSize(width);
    }
  }, [floatingRef, account]);


  return (
    <>
      <FreeFeatureHeader
        canBack={!running}
        title="Free Tools - Delete Product"
      />
      <div className="free-feature-delete-product page">
        <div className="free-feature-delete-product-content">
          <div className="main">
            {account !== null && (
              <div
                className="account-floating"
                ref={floatingRef}
                data-id={account.id}
              >
                <img
                  src={account.avatar}
                  alt={account.name}
                  draggable={false}
                />
                <div className="personal-information">
                  <div className="name">{account.name}</div>
                  <div className="email">{account.email}</div>
                </div>
                {eligible !== undefined && eligible !== null && (
                  <div className="eligible">
                    <div className="count">
                      {eligible.totalProduct > eligible.limit
                        ? 0
                        : eligible.limit - eligible.totalProduct}
                    </div>
                    /<div className="count">{eligible.limit}</div>
                  </div>
                )}
              </div>
            )}
            <Sort
              sortData={sortData}
              value={sort}
              onChange={(sort) => setSort(sort)}
              disabled={running || notSold}
              notSold={notSold}
              setNotSold={setNotSold}
            />
            <div
              className="logs"
              style={{
                maxWidth: `calc(100% - ${floatingSize}px - 90px)`,
                overflowY: "auto",
              }}
            >
              {logs.map((log, index) => (
                <div className="log" key={index}>
                  {log}
                </div>
              ))}
            </div>
            <div className="footer">
              <Button
                type="primary"
                danger={running}
                onClick={() => {
                  if (running) {
                    md.stop();
                  } else {
                    md.start(params.accountId, {
                      id: sort.params.id,
                      value: sort.params.value,
                      notSold
                    });
                  }
                }}
                className="stop-start-toggle-btn"
                disabled={!running && (sort === null || sort < 0)}
              >
                {running ? "Berhenti" : "Mulai"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
