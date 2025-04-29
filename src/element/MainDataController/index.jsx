import { Table } from "antd";
import "./index.scss";
import AccountCell from "./cell/Account";
import ChatCell from "./cell/Chat";
import { useEffect, useState } from "react";
import DiscusCell from "./cell/Discus";
import NewOrderCell from "./cell/NewOrder";
import DikemasCell from "./cell/Dikemas";
import DikirimCell from "./cell/Dikirim";
import ComplaintCell from "./cell/Complaint";
import SaldoCell from "./cell/Saldo";
import BankCell from "./cell/Bank";
import Ongkir from "./cell/Ongkir";
import SkorCell from "./cell/Skor";
import StatusCell from "./cell/Status";
import ProductCell from "./cell/Product";
import ActionCell from "./cell/Action";
import SelectionCheckState from "./SelectionCheckState";
import UpdateDialog from "element/UpdateAccountDialog";
import CustomColumn from "./CustomColumn";
// import HideHeader from './HideHeader'

import OpenBrowser from "utils/openBrowser";
import UpdateAccountDialog from "element/UpdateAccountDialog";

const openBrowser = new OpenBrowser();

export default function MainDataController({
  data,
  sortType,
  search,
  onSelectedRows,
  onSelectedActiveChange,
  ...args
}) {
  const [selected, setSelected] = useState([]);
  const [useSelection, setUseSelection] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState(null);
  // const [hideHeader, setHideHeader] = useState(false)
  const [activeAccount, setActiveAccount] = useState(null);
  const [columnData, setColumnData] = useState([]);
  const [activeColumnIndex, setActiveColumnIndex] = useState([]);

  useEffect(() => {
    setActiveColumnIndex(
      columnData.filter((x) => x.active).map((x) => x.index)
    );
  }, [columnData]);

  useEffect(() => {
    onSelectedRows && onSelectedRows(selected);
    onSelectedActiveChange && onSelectedActiveChange(useSelection);
  }, [selected, useSelection]);

  useEffect(() => {
    openBrowser.onAccountActive = (data) => {
      setActiveAccount(data);
    };
  });

  const columns = [
    {
      title: "No",
      width: 50,
      align: "center",
      fixed: "left",
      render: (data) => data.num,
    },
    {
      title: "Account",
      fixed: "left",
      width: 400,
      render: (data) => (
        <AccountCell
          active={activeAccount === data.id}
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(id, "https://seller-id.tokopedia.com/homepage")
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "badge") {
          return a.badgeImage.toString().localeCompare(b.badgeImage.toString());
        }
        return a.lastUpdated - b.lastUpdated;
      },
    },
    {
      title: "Chat",
      align: "center",
      width: 70,
      render: (data) => (
        <ChatCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(id, "https://seller-id.tokopedia.com/chat/inbox/current")
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "jumlah") {
          return a.chatCount - b.chatCount;
        } else if (sortType === "time") {
          return a.lastChatEpoch - b.lastChatEpoch;
        } else {
          return 0;
        }
      },
    },
    {
      title: "Discus",
      align: "center",
      width: 70,
      render: (data) => (
        <DiscusCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller.tokopedia.com/inbox-talk"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "jumlah") {
          return a.discusCount - b.discusCount;
        } else {
          return 0;
        }
      },
    },
    {
      title: "New Order",
      align: "center",
      width: 100,
      render: (data) => (
        <NewOrderCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller-id.tokopedia.com/order?order_status[]=1&selected_sort=1&tab=to_ship"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "jumlah") {
          return a.orderCount - b.orderCount;
        } else if (sortType === "time") {
          return a.orderEpoch - b.orderEpoch;
        } else if (sortType === "nominal") {
          return a.orderPotency - b.orderPotency;
        }
      },
    },
    {
      title: "Dikemas",
      align: "center",
      width: 90,
      render: (data) => (
        <DikemasCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller.tokopedia.com/myshop_order?auto=1&status=confirm_shipping"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "jumlah") {
          return a.dikemasCount - b.dikemasCount;
        } else if (sortType === "time") {
          return a.dikemasEpoch - b.dikemasEpoch;
        } else if (sortType === "nominal") {
          return a.dikemasPotency - b.dikemasPotency;
        }
      },
    },
    {
      title: "Dikirim",
      align: "center",
      width: 80,
      render: (data) => (
        <DikirimCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller.tokopedia.com/myshop_order?auto=1&status=in_shipping"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "jumlah") {
          return a.dikirimCount - b.dikirimCount;
        } else if (sortType === "nominal") {
          return a.dikirimPotency - b.dikirimPotency;
        } else {
          return 0;
        }
      },
    },
    {
      title: "Complaint",
      align: "center",
      width: 90,
      render: (data) => (
        <ComplaintCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller.tokopedia.com/myshop_order?auto=1&status=complaint"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        if (sortType === "jumlah") {
          return a.complaintCount - b.complaintCount;
        } else if (sortType === "nominal") {
          return a.complaintPotency - b.complaintPotency;
        } else {
          return 0;
        }
      },
    },
    {
      title: "Saldo",
      align: "left",
      width: 120,
      render: (data) => (
        <SaldoCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://www.tokopedia.com/payment/deposit?nref=dside"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        return a.balance - b.balance;
      },
    },
    {
      title: "Bank",
      align: "center",
      width: 100,
      render: (data) => (
        <BankCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://www.tokopedia.com/user/settings/bank"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        return a.bankAN.length - b.bankAN.length
      },
    },
    {
      title: "Skor",
      align: "center",
      width: 60,
      render: (data) => (
        <SkorCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(id, "https://seller.tokopedia.com/shop-score-page")
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        return a.score - b.score
      },
    },
    {
      title: "Ongkir",
      align: "center",
      width: 70,
      render: (data) => (
        <Ongkir
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller.tokopedia.com/bebas-ongkir"
            )
          }
        />
      ),
      sorter: (a, b) => {
        try {
          const aat = a.pinnedAt | 0
          const bat = b.pinnedAt | 0
          if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
          return (a.freeOngkir ? 1 : 0 - b.freeOngkir ? 1 : 0)
        } catch(err) { return 1 }
      },
    },
    {
      title: "Status",
      align: "center",
      width: 70,
      render: (data) => (
        <StatusCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(id, "https://seller.tokopedia.com")
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        // return (a.moderated ? 1 : 0 - b.moderated ? 1 : 0)
        return a.statusSort - b.statusSort
      },
    },
    {
      title: "Product",
      align: "left",
      width: 90,
      render: (data) => (
        <ProductCell
          data={data}
          onClick={(id) =>
            openBrowser.openBrowser(
              id,
              "https://seller.tokopedia.com/manage-product"
            )
          }
        />
      ),
      sorter: (a, b) => {
        const aat = a.pinnedAt | 0
        const bat = b.pinnedAt | 0
        if(aat > 0 || bat > 0) { return 0 - (aat > bat ? 1 : 0) }
        return  (a.productCount) - b.productCount
      },
    },
    {
      title: "Action",
      align: "center",
      width: 60,
      render: (data) => (
        <ActionCell data={data} onEdit={(id) => setSelectedEditId(id)} />
      ),
      fixed: "right",
    },
  ];

  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  const getWindowWidth = () => window.innerWidth;
  const getWindowHeight = () => window.innerHeight;
  const handleResize = () => {
    setWindowWidth(getWindowWidth());
    setWindowHeight(getWindowHeight());
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!useSelection) {
      setSelected([]);
    }
  }, [useSelection]);

  return (
    <div
      className="main-data-controller element"
      data-hide-header={false}
      {...args}
    >
      <UpdateAccountDialog
        id={selectedEditId}
        onClose={() => setSelectedEditId(null)}
      />
      <Table
        className="main-table"
        pagination={{
          pageSizeOptions: [10, 15, 20, 30, 50, 100],
          showSizeChanger: true
        }}
        rowSelection={
          useSelection && {
            type: "checkbox",
            onChange: (_, selectedRows) => {
              setSelected(selectedRows.map((x) => x.id));
            },
            selectedRowKeys: selected,
          }
        }
        size="small"
        columns={columns.filter(
          (_, index) =>
            index === columns.length - 1 || activeColumnIndex.includes(index)
        )}
        dataSource={data.filter((x) => {
          return (
            x.name.toLowerCase().includes(search.toLowerCase()) ||
            x.email.toLowerCase().includes(search.toLowerCase())
          );
        }).sort((a, b) => {
          const aat = a.pinnedAt | 0
          const bat = b.pinnedAt | 0
          return bat - aat
        })}
        scroll={{
          // ukuran padding
          x:
            (windowWidth - 250, // ukuran taskbar
            -20),
          y: windowHeight - 160,
        }}
      />
      {data.length > 0 && (
        <>
          <SelectionCheckState
            active={useSelection}
            onActiveChange={(target) => setUseSelection(target)}
            onSelectAll={() => {
              if (selected.length === data.length) {
                setSelected([]);
              } else {
                setSelected(data.map((x) => x.id));
              }
            }}
          />
          {/* <HideHeader
                        useSelection={useSelection}
                        active={hideHeader}
                        onToggle={() => setHideHeader(x => !x)}
                    /> */}
          <CustomColumn
            style={{
              left: useSelection ? "240px" : "130px",
            }}
            data={columnData}
            onData={(data) => setColumnData(data)}
          />
        </>
      )}
    </div>
  );
}
