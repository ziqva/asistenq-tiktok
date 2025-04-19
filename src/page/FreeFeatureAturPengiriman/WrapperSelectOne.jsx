import learn from "static/icon/learn.png";
import { Alert } from "antd";

export default function WrapperSelectOne() {
  return (
    <div className="wrapper-select-one">
      <div className="container">
        <img src={learn} alt="learn" draggable={false} className="learn" />
        <Alert
          type="info"
          description="Anda setidaknya harus memilih satu akun untuk melanjutkan"
          showIcon
          className="warning"
        />
      </div>
    </div>
  );
}
