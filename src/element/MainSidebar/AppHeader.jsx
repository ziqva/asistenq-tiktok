import icon from "static/image/icon.png";
import { useNavigate } from "react-router-dom";
import ketupat from "static/icon/ketupat.png";

export default function AppHeader() {
  const navigate = useNavigate();
  return (
    <div
      className="app-header"
      data-aos="fade-right"
      onClick={() => {
        navigate("/"); // Navigate goto a homepage
      }}
    >
      <img src={icon} alt="AsistenQ" draggable="false" />
      {/* <img className="ketupat-attr" src={ketupat} alt="" draggable={false} /> */}
      <div className="name">
        <div className="bold">AsistenQ</div>
        <div className="italic">By ZIQVA LABS</div>
      </div>
    </div>
  );
}
