import { React, useState, useEffect } from "react";
import { Link } from "react-router-dom";

import styles from "./InstallPage.module.css";

const InstallPage = ({ setIsPWA }) => {
	const [isiOS, setIsiOS] = useState(/iPhone|iPad|iPod/i.test(navigator.userAgent));

	useEffect(() => {
		console.log(navigator.userAgent);
	}, []);

	const IOSInstructions = () => (
		<>
			<div className={styles.instructionsStep}>
				Just tap
				<span>
					<span className={`${"material-symbols-rounded"}`}>&#xe6b8;</span>
					<span>Share</span>
				</span>
				and
				<span>
					<span className={`${"material-symbols-rounded"}`}>&#xe146;</span>
					<span>Add to Home Screen</span>
				</span>
			</div>
		</>
	);

	const AndroidInstructions = () => (
		<>
			<div className={styles.instructionsStep}>
				Just tap
				<span>
					<span className={`${"material-symbols-rounded"}`}>&#xe5d4;</span>
				</span>
				and
				<span>
					<span className={`${"material-symbols-rounded"}`}>&#xe1fe;</span>
					<span>Add to Home Screen</span>
				</span>
			</div>
		</>
	);

	return (
		<div className={styles.installPage}>
			<Link to="/" className={styles.back}>
				<span className={`${"material-symbols-rounded"}`}>&#xe5cb;</span>
				<p>Back</p>
			</Link>
			<div className={styles.logoWrapper}>
				<img className={styles.logo} src={process.env.PUBLIC_URL + "/static/maskable_icon_x512.png"} alt="logo" />
				<h4>choobs</h4>
			</div>
			<h2>Install choobs.app</h2>
			<div>Install choobs.app on your home screen to enjoy a better experience.</div>
			<div className={styles.instructions}>{isiOS ? <IOSInstructions /> : <AndroidInstructions />}</div>

			<div className={styles.toggleInstructions}>
				<p>Not on {isiOS ? "Safari" : "Chrome"}? </p>
				<button className={styles.link} onClick={() => setIsiOS(!isiOS)} type="button">
					View {isiOS ? "Chrome" : "Safari"} instructions
				</button>
			</div>

			{/iPhone|iPad|iPod/i.test(navigator.userAgent) && <div className={styles.notice}>Note: On iOS, this app can only be installed via Safari.</div>}

			<Link className={styles.link} to="/login">
				Use in browser
			</Link>
		</div>
	);
};

export default InstallPage;
