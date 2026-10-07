import { useState, useEffect, useRef } from "react";
import {
  Dropdown,
  TimePicker,
  Typography,
  Button,
  Popover,
  Tooltip,
} from "antd";
import ApprovalIcon from "@mui/icons-material/Approval";
import dayjs from "dayjs";

const openingHours = [
  {
    name: "Buka 24 jam",
    id: "buka24jam",
    formattedTime: "00:00:00",
    closingTime: "23:59:59",
    status: 1,
  },
  {
    name: "Pilih Jam",
    id: "customtime",
    status: 1,
  },
  {
    name: "Libur rutin (Produkmu bisa dibeli)",
    id: "routinebreaktime_canbuy",
    formattedTime: "00:00:00",
    closingTime: "00:00:00",
    status: 1,
  },
  {
    name: "Libur rutin (Produkmu tidak bisa dibeli)",
    id: "routinebreaktime_cannotbuy",
    formattedTime: "00:00:00",
    closingTime: "00:00:00",
    status: 0,
  },
];

export default function SetDays({ onChange }) {
  const [changedIndex, setChangedIndex] = useState(-1);
  const [selects, setSelects] = useState([
    {
      name: "Senin",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      popOverShow: false,
      selectedOpeningHourFormat: "00:00:00",
      closingTime: "23:59:59",
      status: 1,
    },
    {
      name: "Selasa",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      selectedOpeningHourFormat: "00:00:00",
      popOverShow: false,
      closingTime: "23:59:59",
      status: 1,
    },
    {
      name: "Rabu",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      selectedOpeningHourFormat: "00:00:00",
      popOverShow: false,
      closingTime: "23:59:59",
      status: 1,
    },
    {
      name: "Kamis",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      selectedOpeningHourFormat: "00:00:00",
      popOverShow: false,
      closingTime: "23:59:59",
      status: 1,
    },
    {
      name: "Jumat",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      selectedOpeningHourFormat: "00:00:00",
      popOverShow: false,
      closingTime: "23:59:59",
      status: 1,
    },
    {
      name: "Sabtu",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      selectedOpeningHourFormat: "00:00:00",
      popOverShow: false,
      closingTime: "23:59:59",
      status: 1,
    },
    {
      name: "Minggu",
      openingHours: openingHours,
      selectedOpeningHours: openingHours[0].id,
      selectedOpeningHoursName: openingHours[0].name,
      selectedOpeningHourFormat: "00:00:00",
      popOverShow: false,
      closingTime: "23:59:59",
      status: 1,
    },
  ]);

  useEffect(() => {
    onChange && onChange(selects);
  }, [selects]);

  const applyForAll = () => {
    const data = [...selects][changedIndex];
    let x = [...selects];
    if (data) {
      for (let i = 0; i < x.length; i++) {
        x[i].openingHours = data.openingHours;
        x[i].selectedOpeningHours = data.selectedOpeningHours;
        x[i].selectedOpeningHoursName = data.selectedOpeningHoursName;
        x[i].selectedOpeningHourFormat = data.selectedOpeningHourFormat;
        x[i].popOverShow = false;
        x[i].closingTime = data.closingTime;
        x[i].status = data.status;
      }
    }
    setSelects(x);
    setChangedIndex(-1);
  };

  const handleClickOpeningHour = (
    openingIndex,
    selectIndex,
    key,
    format = null
  ) => {
    let s = [...selects];
    if (key === "customtime") {
      s[selectIndex].popOverShow = true;
    } else {
      s[selectIndex].selectedOpeningHours = key;
      s[selectIndex].selectedOpeningHoursName = s[
        selectIndex
      ].openingHours.find((x) => x.id === key).name;
      s[selectIndex].popOverShow = false;
      if (format) {
        s[selectIndex].selectedOpeningHourFormat = format;
      }
      if (s[selectIndex].openingHours[openingIndex].closingTime) {
        s[selectIndex].closingTime =
          s[selectIndex].openingHours[openingIndex].closingTime;
      }
      if (
        typeof s[selectIndex].openingHours[openingIndex].status === "number"
      ) {
        s[selectIndex].status =
          s[selectIndex].openingHours[openingIndex].status;
      }
      setChangedIndex(selectIndex);
    }
    setSelects(s);
  };

  return (
    <div className="set-days">
      <table>
        <thead>
          <tr>
            <th>Hari</th>
            <th>Jam Buka</th>
            <th>Jam Tutup</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {selects.map((select, _) => (
            <tr key={_} id={_}>
              <td>
                <Typography>{select.name}</Typography>
              </td>
              <td>
                <Popover
                  content={
                    <TimePicker
                      defaultValue={dayjs("00:00:00", "HH:mm:ss")}
                      format="HH:mm"
                      placeholder="Pilih jam"
                      onChange={(sender) => {
                        const formattedTime = sender.format("HH:mm:00");
                        let s = [...selects];
                        s[_].selectedOpeningHourFormat = formattedTime;
                        s[_].selectedOpeningHours = "customtime";
                        s[
                          _
                        ].selectedOpeningHoursName = `Pilih Jam (${sender.format(
                          "HH:mm"
                        )})`;
                        setSelects(s);
                        setChangedIndex(_);
                      }}
                    />
                  }
                  open={select.popOverShow}
                  onOpenChange={(e) => {
                    if (!e) {
                      let s = [...selects];
                      s[_].popOverShow = e;
                      setSelects(s);
                    }
                  }}
                >
                  <Dropdown
                    menu={{
                      items: select.openingHours.map((openingHour, i) => {
                        return {
                          key: openingHour.id,
                          label: openingHour.name,
                          disabled:
                            openingHour.id === select.selectedOpeningHours &&
                            openingHour.id !== "customtime",
                          onClick: (e) =>
                            handleClickOpeningHour(
                              i,
                              _,
                              e.key,
                              openingHour.formattedTime || null
                            ),
                        };
                      }),
                    }}
                  >
                    <Button>{select.selectedOpeningHoursName}</Button>
                  </Dropdown>
                </Popover>
              </td>
              <td>
                <TimePicker
                  value={dayjs(select.closingTime, "HH:mm:ss")}
                  disabled={select.selectedOpeningHours !== "customtime"}
                  locale="id"
                  style={{ width: "110px" }}
                  format={"HH:mm"}
                  defaultValue={dayjs("00:00:00", "HH:mm:ss")}
                  onChange={(e) => {
                    const formatted = e.format("HH:mm:00");
                    let s = [...selects];
                    s[_].closingTime = formatted;
                    setSelects(s);
                    setChangedIndex(_);
                  }}
                />
              </td>
              <td>
                {changedIndex === _ && (
                  <Tooltip title="Terapkan untuk semua">
                    <Button
                      icon={<ApprovalIcon />}
                      onClick={applyForAll}
                      type="text"
                    />
                  </Tooltip>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
