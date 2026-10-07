import { Checkbox, Dropdown, Select } from "antd";

export default function Sort({ sortData, value, onChange, disabled, notSold, setNotSold }) {
  return (
    <div className="sort-floating">
      <Select
        placeholder="Urutkan berdasarkan"
        value={sortData.indexOf(value)}
        disabled={disabled}
        onChange={(sender) => {
          onChange(sortData[sender] || null);
        }}
        style={{
          width: "200px",
        }}
      >
        <Select.Option value={-1}>- Urutkan Berdasarkan -</Select.Option>
        {sortData.map((data, _) => (
          <Select.Option key={_} value={_}>
            {data.name}
          </Select.Option>
        ))}
      </Select>

      <Checkbox
        checked={notSold}
        onChange={e => {
          setNotSold(e.target.checked)
        }}
      >Tidak Terjual</Checkbox>
    </div>
  );
}
