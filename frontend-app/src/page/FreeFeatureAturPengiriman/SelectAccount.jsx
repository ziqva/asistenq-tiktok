import server from "config/server";
import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Input, Empty, Checkbox, Tooltip, Button, Dropdown } from "antd";
import getGroups from "utils/group/getData";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import SortIcon from "@mui/icons-material/Sort";

let refreshTimeout;

const getAccounts = (search = "", group = "all") => {
  return new Promise((resolve, reject) => {
    const url = `${server.api.base}/operationalSchedule/accounts/${search}?group=${group}`;
    axios
      .get(url)
      .then(({ data }) => {
        if (data.error) {
          reject(data.msg);
        } else {
          resolve(data.data);
        }
      })
      .catch((err) => reject(err.message || err));
  });
};

export default function SelectAccount({ onSelectedChange }) {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [accountIds, setAccountIds] = useState([]);
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState("all");

  useEffect(() => {
    getGroups()
      .then((data) => {
        setGroups(data.groups);
      })
      .catch((err) => console.error(err.message || err));
  }, []);

  useEffect(() => {
    setAccountIds([...accounts].map((x) => x.id));
  }, [accounts]);

  useEffect(() => {
    onSelectedChange && onSelectedChange(selectedIds);
  }, [selectedIds]);

  const refresh = (search = "") => {
    getAccounts(search, group)
      .then((data) => {
        setAccounts(data.accounts);
      })
      .catch((err) => console.error(err.message || err));
  };

  useEffect(() => {
    refresh(search);
  }, [group]);

  useEffect(() => {
    if (refreshTimeout) clearTimeout(refreshTimeout);

    refreshTimeout = setTimeout(() => {
      refresh(search);
    }, 600);
  }, [search]);

  useEffect(() => {
    refresh();
    setSelectedIds([]);
  }, [location]);

  return (
    <div className="select-account">
      <div className="search-container">
        <Tooltip title={`Active: ${group === "all" ? "Semua" : group}`}>
          <Dropdown
            menu={{
              onClick: (key) => {
                setGroup(key.key);
              },
              items: [
                {
                  key: "all",
                  label: "Semua",
                },
                ...groups.map((group, _) => {
                  return {
                    key: group.name,
                    label: group.name,
                  };
                }),
              ],
            }}
          >
            <Button icon={<SortIcon />} type="text" />
          </Dropdown>
        </Tooltip>
        <Tooltip title="Tandai">
          <Checkbox
            checked={
              selectedIds.length === accountIds.length && accountIds.length > 0
            }
            indeterminate={
              selectedIds.length > 0 && selectedIds.length !== accountIds.length
            }
            onChange={(sender) => {
              if (sender.target.checked) {
                setSelectedIds(accountIds);
              } else {
                setSelectedIds([]);
              }
            }}
          />
        </Tooltip>
        <Input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(sender) => setSearch(sender.target.value)}
        />
      </div>
      <div className="accounts">
        {accounts.length < 1 && (
          <Empty className="empty" description="Oops, Akun tidak ditemukan" />
        )}
        {accounts.length > 0 &&
          accounts.map((account, _) => (
            <div
              className="account"
              key={_}
              data-selected={
                selectedIds.findIndex((x) => x === account.id) >= 0 ? "1" : "0"
              }
              onClick={() => {
                const selected =
                  selectedIds.findIndex((x) => x === account.id) >= 0;
                let x = [...selectedIds];
                if (!selected) {
                  x.push(account.id);
                } else {
                  x = x.filter((x) => x !== account.id);
                }
                setSelectedIds(x);
              }}
            >
              <h3 className="no">{_ + 1}</h3>
              <Checkbox
                checked={selectedIds.findIndex((x) => x === account.id) >= 0}
              />
              <img
                src={account.avatar}
                alt={account.name}
                className="avatar"
                title={account.name}
              />
              <div className="detail">
                <div className="name">{account.name}</div>
                <div className="email">{account.email}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
