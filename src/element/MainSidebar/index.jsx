import "./main-sidebar.scss";
import AddAccountIcon from "@mui/icons-material/PersonAdd";
import AppHeader from "./AppHeader";
import FilterItemIcon from "./FilterItemIcon";
import Saldo from "./Saldo";
import FilterButton from "./FilterButton";
import AddAccountDialog from "element/AddAccountDialog";
import { useEffect, useState } from "react";
import SidebarData from "utils/main/SidebarData";

const sidebarData = new SidebarData();

export default function MainSidebar({
  active,
  onActiveChange,
  selectedIds,
  useSelection,
  onResetSelectedIds,
}) {
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [sd, setSidebarData] = useState({});
  const [refreshData, setRefreshData] = useState(null)

  useEffect(() => {
    sidebarData.onData = (data) => {
      setSidebarData(data);
    };

    sidebarData.onRefreshData = (data) => {
      setRefreshData(data)
    }
  }, []);

  return (
    <div className="element main-sidebar">
      <AddAccountDialog
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
      />
      <AppHeader />
      <div
        className="separator"
        data-aos="fade-right"
        data-aos-delay={300}
      ></div>
      <button
        className="add-account-btn"
        data-aos="fade-up"
        data-aos-delay={400}
        onClick={() => setAddAccountOpen((x) => !x)}
      >
        <AddAccountIcon className="icon" />
        <div className="text">Tambahkan Akun</div>
      </button>
      <FilterItemIcon
        active={active}
        onActiveChange={onActiveChange}
        data={sd}
      />
      <Saldo count={sd.saldo || 0} active={active} data={sd} />
      {refreshData && (
        <FilterButton
          active={active}
          onDeleted={onResetSelectedIds}
          data={sd}
          onActiveChange={onActiveChange}
          useSelection={useSelection}
          selectedIds={selectedIds}
          refreshData={refreshData}
        />
      )}
      {/* <div className="separator"></div> */}
    </div>
  );
}
