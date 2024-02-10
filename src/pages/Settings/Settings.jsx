import EditClasses from "../EditClasses/EditClasses";
import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

import PFP from "../../components/PFP/PFP";

import styles from "./Settings.module.css";

function Settings(props) {
	const uid = props.uid;
	const [userData, setUserData] = useState();
	const [editName, setEditName] = useState(false);
	const [name, setName] = useState("");
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [showPFPModal, setShowPFPModal] = useState(false);
	const [modalFade, setModalFade] = useState(true);

	const [previewPFP, setPreviewPFP] = useState([]);

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

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				if (localStorage.getItem("userData")) {
					setUserData(JSON.parse(localStorage.getItem("userData")));
					setPreviewPFP(JSON.parse(localStorage.getItem("userData")).pfp);
				} else {
					const userRef = doc(db, "users", uid);
					const userDataSnapshot = await getDoc(userRef);
					const userData = {
						email: userDataSnapshot.data().email,
						name: userDataSnapshot.data().name,
						pfp: userDataSnapshot.data().pfp,
					};

					if (userData) {
						setUserData(userData);
						setPreviewPFP(userData.pfp);
						localStorage.setItem("userData", JSON.stringify(userData));
					} else {
						console.error("User data not available");
					}
				}
			} catch (error) {
				console.error("Error fetching user data:", error);
			}
		};

		if (uid) {
			fetchUserData();
		}
	}, [uid]);

	useEffect(() => {
		if (userData) {
			if (!userData.pfp) {
				const userCollectionRef = doc(db, "users", uid);
				const pfp = [["#ff3c3c", "#f68729", "#41e241", "#6be56b", "#40e0d0", "#9c3900", "#ff9494", "#407f40", "#4764ae", "#54808c"][Math.floor(Math.random() * 10)], '🙂'];
				updateDoc(userCollectionRef, {
					photoURL: deleteField(),
					pfp: pfp,
				});
			}
		}
	}, [userData, uid]);

	function logout() {
		const auth = getAuth();

		signOut(auth)
			.then(() => {
				document.cookie = "";
				window.localStorage.clear();
				window.sessionStorage.clear();
			})
			.catch((error) => {
				console.error("Error signing out:", error);
			});
	}

	const openModal = (modal) => {
		setModalFade(true);
		switch (modal) {
			case "logout":
				setShowLogoutModal(true);
				break;
			case "pfp":
				setShowPFPModal(true);
				break;
			default:
				break;
		}
	};

	const closeModal = () => {
		setModalFade(false);
		const timeoutId = setTimeout(() => {
			setShowLogoutModal(false);
			setShowPFPModal(false);
		}, 200);

		return () => clearTimeout(timeoutId);
	};

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && (showLogoutModal || showPFPModal)) {
				closeModal();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showLogoutModal, showPFPModal]);

	const ColorPicker = () => {
		const colors = ["#ff3c3c", "#f68729", "#41e241", "#6be56b", "#40e0d0", "#9c3900", "#ff9494", "#407f40", "#4764ae", "#54808c"];

		return (
			<div className={styles.colorPicker}>
				{colors.map((color, index) => (
					<button key={index} style={{ backgroundColor: color }} onClick={() => updatePreviewPFP(color)}>
						{previewPFP[0] === color && <span className={`${"material-symbols-rounded"}`}>&#xe876;</span>}
					</button>
				))}
			</div>
		);
	};

	const updatePreviewPFP = (e) => {
		if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(e)) {
			// regex to detect hex code
			setPreviewPFP([e, previewPFP[1]]);
		} else {
			setPreviewPFP([previewPFP[0], e.native]);
		}
	};

	const savePreviewPFP = () => {
		if (JSON.stringify(previewPFP) !== JSON.stringify(userData.pfp)) {
			const userCollectionRef = doc(db, "users", uid);
			updateDoc(userCollectionRef, {
				photoURL: deleteField(),
				pfp: previewPFP,
			});

			setUserData({
				email: userData.email,
				name: userData.name,
				pfp: previewPFP,
			});
			localStorage.setItem(
				"userData",
				JSON.stringify({
					email: userData.email,
					name: userData.name,
					pfp: previewPFP,
				})
			);
		}
		closeModal();
	};

	return (
		<>
			<div className={styles.settings}>
				<h1>Settings</h1>
				{userData && (
					<>
						<div className={styles.userInfo}>
							<button
								className={styles.pfp}
								onClick={() => {
									openModal("pfp");
								}}
							>
								<PFP pfp={userData.pfp} size={4} />
								<span className={`${"material-symbols-rounded"}`}>&#xe3c9;</span>
							</button>
							{showPFPModal && (
								<div className={`${styles.modalContainer} ${modalFade ? styles.fade : ""} ${isMobile && styles.mobileModal}`} onClick={closeModal}>
									<div className={`${styles.modalContent} ${modalFade ? styles.slide : ""} ${styles.pfpModal}`} onClick={(e) => e.stopPropagation()}>
										<div>
											<PFP pfp={previewPFP} size={6} />
											<div>
												<h3>Edit Profile Picture</h3>
												{userData && <ColorPicker />}
											</div>
										</div>
										<Picker data={data} theme={`dark`} navPosition={`none`} previewPosition={`none`} dynamicWidth={true} onEmojiSelect={updatePreviewPFP} />
										<div className={styles.modalButtons}>
											<button
												onClick={() => {
													setPreviewPFP(userData.pfp);
													closeModal();
												}}
											>
												Discard Changes
											</button>
											<button className={styles.save} onClick={savePreviewPFP}>
												Save
											</button>
										</div>
									</div>
								</div>
							)}
							<div>
								<div className={styles.name}>
									{!editName ? (
										<>
											<h3>{userData.name}</h3>
											<button className={styles.editButton} type="submit" onClick={() => setEditName(true)}>
												<span className={`${"material-symbols-rounded"}`}>&#xe3c9;</span>
											</button>
										</>
									) : (
										<form>
											<input type="text" placeholder={userData.name} value={name} className={styles.input} onChange={(e) => setName(e.target.value)} />
											<button className={styles.editButton} type="submit" onClick={() => setEditName(false)}>
												<span className={`${"material-symbols-rounded"}`}>&#xe5c9;</span>
											</button>
											<button className={styles.editButton} type="submit" onClick={() => setEditName(false)}>
												<span className={`${"material-symbols-rounded"}`}>&#xe161;</span>
											</button>
										</form>
									)}
								</div>
								<p>{userData.email}</p>
							</div>
						</div>
					</>
				)}
				<EditClasses />
				<button className={styles.logout} onClick={() => openModal("logout")}>
					<span className={`${"material-symbols-rounded"}`}>&#xe9ba;</span>
					Log Out
				</button>
				{showLogoutModal && (
					<div className={`${styles.modalContainer} ${modalFade ? styles.fade : ""} ${isMobile && styles.mobileModal}`} onClick={closeModal}>
						<div className={`${styles.modalContent} ${modalFade ? styles.slide : ""}`} onClick={(e) => e.stopPropagation()}>
							<h3>Log Out</h3>
							<p>Are you sure you want to log out?</p>
							<div className={styles.modalButtons}>
								<button onClick={closeModal}>Cancel</button>
								<button className={styles.logout} onClick={logout}>
									<span className={`${"material-symbols-rounded"}`}>&#xe9ba;</span>
									Log Out
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default Settings;
