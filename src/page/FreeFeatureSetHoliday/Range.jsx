import { Button, DatePicker } from "antd";
import { useEffect, useState } from "react";
import moment from "moment-timezone";
import "moment/locale/id";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

export default function Range({ onChange }) {
  const [from, setFrom] = useState(dayjs().locale("id"));
  const [to, setTo] = useState(dayjs().add(3, "days"));

  useEffect(() => {
    if (to < from) {
      setTo(from);
    }
    onChange && onChange([from, to]);
  }, [to, from]);

  return (
    <div className="range-container">
      <table>
        <thead>
          <tr>
            <th>Mulai</th>
            <th>Selesai</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <DatePicker
                disabledTime={true}
                hideDisabledOptions={true}
                format="dddd, DD MMM YYYY"
                locale="id"
                disabledDate={(current) => {
                  const target = dayjs().subtract(1, "days").locale("id");
                  return current <= target;
                }}
                value={from.locale("id")}
                onChange={(s) => setFrom(s.locale("id"))}
              />
            </td>
            <td>
              <DatePicker
                disabledTime={true}
                hideDisabledOptions={true}
                format="dddd, DD MMM YYYY"
                locale="id"
                disabledDate={(current) => {
                  return current <= from.subtract(1, "days");
                }}
                value={to.locale("id")}
                onChange={(s) => setTo(s.locale("id"))}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
