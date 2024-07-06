import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import styles from "./LandingPage.module.css";

function LandingPage({ isPWA }) {
	const [isMobile, setIsMobile] = useState(isMobileDevice());

	function isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(isMobileDevice());
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<>
			<div className={styles.page}>
				<div className={styles.logoWrapper}>
					<img className={styles.logo} src={process.env.PUBLIC_URL + "/static/maskable_icon_x512.png"} alt="logo" />
					<h4>choobs</h4>
				</div>
				<div className={styles.schedulingSimplified}>
					<h2>Scheduling, simplified.</h2>
					<p>A better way to view your schedule</p>
				</div>
				<div className={styles.buttons}>
					{!isMobile || isPWA ? (
						<>
							<Link to="/register" className={styles.getStarted}>
								Get Started
							</Link>
							<Link to="/login" className={styles.login}>
								Log In
							</Link>
						</>
					) : (
						<Link to="/download" className={styles.install}>
							<span className={`${"material-symbols-rounded"}`}>&#xf090;</span>
							<span>Install</span>
						</Link>
					)}
				</div>
				{isMobile ? (
					<img className={styles.screenshot} src={process.env.PUBLIC_URL + "/static/screenshot_mobile.png"} alt="screenshot" />
				) : (
					<img className={`${styles.screenshot} ${styles.desktop}`} src={process.env.PUBLIC_URL + "/static/screenshot_desktop.png"} alt="screenshot" />
				)}
			</div>
		</>
	);
}

export default LandingPage;
