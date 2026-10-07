import "./home-header.scss";
import Switch from "@mui/material/Switch";
import { useEffect, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import BotStatus from "utils/main/BotStatus";
import SortType from "./SortType";
import { Input } from "antd";
import Import from "./Import";
import Export from "./Export";
import Group from "./Group";
import MassUpdateGroup from "./MassUpdateGroup";
import News from "./News";
import FreeFeature from "element/FreeFeature";
import PMType from "./PMType";

let botStatus;
let searchTimeout;

export default function HomeHeader({
  onSortTypeChange,
  onSearchChange,
  useSelection,
  selectedRows,
}) {
  const [botActive, setBotActive] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    botStatus = new BotStatus({
      onStatus: (status) => setBotActive(status.running),
    });
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    searchTimeout = setTimeout(() => {
      onSearchChange && onSearchChange(search);
    }, 800);

    return () => {
      clearTimeout(searchTimeout);
    };
  }, [search]);

  return (
    <div className="home-component home-header">
      <div className="left-components">
        <SortType
          onSortTypeChange={onSortTypeChange}
          data-aos="fade-left"
          data-aos-duration={200}
        />
        <div
          className="search-container"
          data-aos="fade-left"
          data-aos-duration={300}
        >
          <Input
            value={search}
            onChange={(sender) => setSearch(sender.target.value)}
            placeholder="Cari"
          />
        </div>
      </div>
      <div className="right-components">
        <News />
        <MassUpdateGroup useSelection={useSelection} selecteds={selectedRows} />
        {/* <PMType data-aos="fade-left" data-aos-duration={300} /> */}
        <Group data-aos="fade-left" data-aos-duration={400} />
        <Import data-aos="fade-left" data-aos-duration={500} />
        <Export
          selectedAccounts={selectedRows}
          useSelection={useSelection}
          data-aos="fade-left"
          data-aos-duration={600}
        />
        <FreeFeature data-aos="fade-left" data-aos-duration={700} selectedIds={selectedRows} />
        <Tooltip title={botActive ? "Nonaktifkan bot" : "Aktifkan bot"}>
          <div
            className="active-bot-controller"
            data-aos="fade-left"
            data-aos-duration={800}
          >
            <Switch
              size="small"
              checked={botActive}
              onChange={() => botStatus.toggle()}
            />
            <div className="title">Status Bot</div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
