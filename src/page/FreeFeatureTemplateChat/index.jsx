import FreeFeatureHeader from "element/FreeFeatureHeader";
import { useEffect, useState } from "react";
import "./index.scss";
import { Input, Button, Spin, Empty, Popconfirm, Alert } from "antd";
import Setting from "utils/Setting";
import getGroupData from "utils/group/getData";
import server from "config/server";
import axios from "axios";
import AddChat from "./AddChat";
import ChatItem from "./ChatItem";
import refresh from "utils/main/account/refresh";

const setting = new Setting();

const unGroup = {
  name: "ungroup",
  label: "Tanpa Group",
};

export default function FreeFeatureUploadProduct() {
  const [uploading, setUploading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [addChatOpen, setAddChatOpen] = useState(false);

  useEffect(() => {
    document.title = "Free Feature | Template Chat";
  }, []);

  const updateChat = () => {
    const url = `${server.api.base}/templateChat/getData/${selected}`;
    axios
      .get(url)
      .then(({ data }) => {
        setLoading(false);
        setChats(data.data.chats);
      })
      .catch((err) => {
        console.error(false);
        setLoading(true);
      });
  };

  useEffect(() => {
    if (typeof selected === "string") {
      setLoading(true);
      updateChat();
    }
  }, [selected]);

  useEffect(() => {
    if (groups.length >= 1) {
      setSelected(groups[0].name);
    }
  }, [groups]);

  useEffect(() => {
    getGroupData()
      .then((data) => {
        setGroups([unGroup, ...data.groups]);
      })
      .catch((err) => {
        console.error(err.message || err);
      });
  }, []);

  return (
    <>
      <AddChat
        open={addChatOpen}
        onClose={() => {
          setAddChatOpen(false);
        }}
        selected={selected}
        onAdded={updateChat}
      />
      <FreeFeatureHeader
        title="Free Tools - Template Chat"
        canBack={!uploading}
      />
      <div className="free-feature-template-chat page">
        <div className="left-side">
          {groups.map((group, _) => (
            <div
              className="group"
              data-active={group.name === selected ? "y" : "n"}
              key={_}
              id={group.name}
              onClick={() => setSelected(group.name)}
            >
              {group.label || group.name}
            </div>
          ))}
        </div>

        <div className="main">
          {loading && <Spin className="loading-spin" />}
          {!loading && chats.length < 1 && (
            <Empty
              className="empty"
              description={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => setAddChatOpen(true)}
                >
                  Tambahkan Chat
                </Button>
              }
            />
          )}
          {!loading && chats.length >= 1 && (
            <div className="chats-container">
              <div className="chats-header">
                <Alert
                  data-aos="fade-down"
                  description="Min 5 template chat"
                  size="small"
                  showIcon
                  className="alert"
                />
                <Button
                  type="primary"
                  onClick={() => setAddChatOpen(true)}
                  data-aos="fade-down"
                >
                  Tambahkan Chat
                </Button>
              </div>
              <div className="chats">
                {chats.map((chat, _) => (
                  <ChatItem
                    key={_}
                    chat={chat}
                    selected={selected}
                    onUpdate={updateChat}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
