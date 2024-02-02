import { Link, useLocation } from "react-router-dom";

import Social from "../Social/Social";
import Schedule from "../Schedule/Schedule";
import Settings from "../Settings/Settings";

import FeedbackForm from "../FeedbackForm/FeedbackForm";

import styles from "./SideBar.module.css";

function SideBar(props) {
	return (
		<>
			<div className={styles.page}>
				<div className={styles.SideBar}>
					<div>
						<Link
							to="/"
							className={`${styles.link} ${
								useLocation().pathname === "/"
									? styles.highlight
									: ""
							}`}
						>
							<span
								className={`${"material-symbols-rounded"} ${
									styles.icon
								}`}
							>
								&#xe8e9;
							</span>
							<p>Schedule</p>
						</Link>
						<Link
							to="/settings"
							className={`${styles.link} ${
								useLocation().pathname === "/settings"
									? styles.highlight
									: ""
							}`}
						>
							<span
								className={`${"material-symbols-rounded"} ${
									styles.icon
								}`}
							>
								&#xe8b8;
							</span>
							<p>Settings</p>
						</Link>
					</div>
				</div>
				{useLocation().pathname === "/" && (
					<>
						<div id="schedule" className={`${styles.schedule}`}>
							<Schedule uid={props.uid} />
						</div>
						<div id="social" className={`${styles.social}`}>
							<Social />
						</div>
					</>
				)}
				{useLocation().pathname === "/settings" && (
					<>
						<div id="settings" className={`${styles.settings}`}>
							<Settings uid={props.uid} />
						</div>
					</>
				)}
			</div>
			<FeedbackForm uid={props.uid} />
		</>
	);
}

export default SideBar;
