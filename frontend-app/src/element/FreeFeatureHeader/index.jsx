import "./free-feature-header.scss";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function FreeFeatureHeader({ title, canBack = true, selectedIds = [] }) {
  return (
    <div className="free-feature-header element">
      <div className="back-button-container">
        <button
          className="btn"
          onClick={() => window.close()}
          disabled={!canBack}
        >
          <ArrowBackIcon className="icon" />
        </button>
      </div>
      <div className="information">
        <div className="title">{title}</div>
        <div className="desc">By Ziqva Labs</div>
      </div>
    </div>
  );
}
