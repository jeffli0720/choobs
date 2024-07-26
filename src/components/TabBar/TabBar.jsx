import { Outlet, Link, useLocation } from "react-router-dom";
import styles from "./TabBar.module.css";
import FeedbackForm from "../FeedbackForm/FeedbackForm";

function TabBar(props) {
	return (
		<>
			<Outlet />
			<div className={styles.TabBar}>
				<Link to="/social" className={`${styles.link} ${useLocation().pathname === "/social" ? styles.highlight : ""}`}>
					<span className={`${"material-symbols-rounded"} ${styles.icon}`}>&#xf233;</span>
				</Link>
				<Link to="/" className={`${styles.link} ${useLocation().pathname === "/" ? styles.highlight : ""}`}>
					<span className={`${"material-symbols-rounded"} ${styles.icon}`}>&#xe8e9;</span>
				</Link>
				<Link to="/settings" className={`${styles.link} ${useLocation().pathname === "/settings" ? styles.highlight : ""}`}>
					<span className={`${"material-symbols-rounded"} ${styles.icon}`}>&#xe8b8;</span>
				</Link>
			</div>
			<FeedbackForm uid={props.uid} />
		</>
	);
}

export default TabBar;
