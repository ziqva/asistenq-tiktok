import ChatIcon from "static/icon/chat-animated.gif";
import OrderIcon from "static/icon/order-animated.gif";
import DiscusiIcon from "static/icon/discus-animated.gif";
import DikemasIcon from "static/icon/processing-animated.gif";
import DikirimIcon from "static/icon/shipping-animated.gif";
import ComplaintIcon from "static/icon/complaint.png";
import Badge from "@mui/material/Badge";
import { Opacity } from "@mui/icons-material";

export default function FilterItemIcon({
  active,
  onActiveChange,
  data,
  useSelection,
  selectedIds,
}) {
  return (
    <div className="filter-item-icon">
      <div className="row" data-aos="fade-up" data-aos-delay={500}>
        <Button
          icon={ChatIcon}
          text="Chat"
          active={active === "chat"}
          onClick={() => onActiveChange("chat")}
          count={data.chatCount || 0}
        />
        
        {/* <Button
          icon={DiscusiIcon}
          text="Diskusi"
          active={active === "discus"}
          onClick={() => onActiveChange("discus")}
          count={data.discusCount || 0}
        /> */}
        <Button
          icon={OrderIcon}
          text="Order"
          active={active === "order"}
          onClick={() => onActiveChange("order")}
          count={data.orderCount || 0}
        />
        <Button
          icon={DikemasIcon}
          text="Dikemas"
          active={active === "packing"}
          onClick={() => onActiveChange("packing")}
          count={data.dikemasCount || 0}
        />
      </div>
      <div className="row" data-aos="fade-up" data-aos-delay={600}>
        {/* <Button
          icon={DikemasIcon}
          text="Dikemas"
          active={active === "packing"}
          onClick={() => onActiveChange("packing")}
          count={data.dikemasCount || 0}
        /> */}
        <Button
          icon={DikirimIcon}
          text="Dikirim"
          active={active === "shipping"}
          onClick={() => onActiveChange("shipping")}
          count={data.dikirimCount || 0}
        />
        <Button
          icon={DikemasIcon}
          text="Dikemas"
          active={active === "packing"}
          onClick={() => onActiveChange("packing")}
          count={data.dikemasCount || 0}
          style={{
            opacity: 0,
            cursor: 'default'
          }}
          disabled={true}
        />
        <Button
          icon={ComplaintIcon}
          text="Komplain"
          active={active === "complaint"}
          onClick={() => onActiveChange("complaint")}
          count={data.complaintCount || 0}
        />
      </div>
    </div>
  );
}

function Button({ text, icon, active, count, onClick, ...args }) {
  return (
    <button
      {...args}
      onClick={onClick}
      className="icon-button"
      data-active={active ? "1" : "0"}
    >
      <Badge badgeContent={count} max={99999} color="primary">
        <div>
          <img
            draggable={false}
            className="icon"
            src={icon}
            alt={text}
            title={text}
          />
          <div className="text">{text}</div>
        </div>
      </Badge>
    </button>
  );
}
