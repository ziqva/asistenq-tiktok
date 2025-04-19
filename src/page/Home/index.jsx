import Container from "element/Container";
import MainSidebar from "element/MainSidebar";
import "./home.scss";
import { useEffect, useState } from "react";
import Header from "element/HomeHeader";
import Filter from "utils/main/sidebar/filter";
import MainData from "utils/main/MainData";
import MainDataController from "element/MainDataController";

const filter = new Filter();
const MAINDATA = new MainData();

export default function Home() {
  const [activeFilter, setActiveFilter] = useState(null);
  const [mainData, setMainData] = useState([]);
  const [sortType, setSortType] = useState("jumlah");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [useSelection, setUseSelection] = useState(false);

  useEffect(() => {
    filter.onFilter = setActiveFilter;
    MAINDATA.onMainData = (data) => {
      setMainData(data);
    };
    MAINDATA.socket.on("connect", () => {
      MAINDATA.getMainData();
    });
  }, []);

  return (
    <Container className="page home" id="home-page">
      <MainSidebar
        active={activeFilter}
        onActiveChange={(item) => filter.setActive(item)}
        useSelection={useSelection}
        selectedIds={selected}
        onResetSelectedIds={() => setSelected([])}
      />
      <div className="right-side">
        <Header
          onSearchChange={(search) => setSearch(search)}
          onSortTypeChange={(sortType) => setSortType(sortType)}
          useSelection={useSelection}
          selectedRows={selected}
        />
        <MainDataController
          data-aos="fade-up"
          data-aos-delay={1000}
          onSelectedActiveChange={(active) => setUseSelection(active)}
          onSelectedRows={(rows) => setSelected(rows)}
          sortType={sortType}
          data={mainData}
          search={search}
        />
      </div>
    </Container>
  );
}
