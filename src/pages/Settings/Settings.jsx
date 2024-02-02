import EditClasses from "../EditClasses/EditClasses";
import { useEffect, useState } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// import EmojiPicker from 'emoji-picker-react';

import styles from "./Settings.module.css";

function Settings(props) {
	const uid = props.uid;
	const [userData, setUserData] = useState();
	const [editName, setEditName] = useState(false);
	const [name, setName] = useState("");
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [showPFPModal, setShowPFPModal] = useState(false);
	const [modalFade, setModalFade] = useState(true);

	const [isMobile, setIsMobile] = useState(isMobileDevice());

	function isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
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
				} else {
					const userRef = doc(db, "users", uid);
					const userDataSnapshot = await getDoc(userRef);
					const userData = userDataSnapshot.data();

					if (userData) {
						localStorage.setItem(
							"userData",
							JSON.stringify({
								email: userData.email,
								name: userData.name,
								photoURL: userData.photoURL,
							})
						);
						setUserData(userData);
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
			if (!userData.photoURL) {
				const userCollectionRef = doc(db, "users", uid);
				updateDoc(userCollectionRef, {
					photoURL: `https://ui-avatars.com/api/?name=${userData.name
						.trim()
						.replace(/\s+/g, "+")}&background=random&size=128`,
				});
			}
		}
	}, [userData, uid]);

	function logout() {
		const auth = getAuth();

		// Sign out the user
		signOut(auth)
			.then(() => {
				// Clear cookies/cache
				document.cookie = ""; // Clear all cookies
				window.localStorage.clear(); // Clear local storage
				window.sessionStorage.clear(); // Clear session storage
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
								<img
									src={userData.photoURL}
									alt={userData.name}
								/>
								<span
									className={`${"material-symbols-rounded"}`}
								>
									&#xe3c9;
								</span>
							</button>
							{showPFPModal && (
								<div
									className={`${styles.modalContainer} ${
										modalFade ? styles.fade : ""
									} ${isMobile && styles.mobileModal}`}
									onClick={closeModal}
								>
									<div
										className={`${styles.modalContent} ${
											modalFade ? styles.slide : ""
										}`}
										onClick={(e) => e.stopPropagation()}
									>
										<img
											src={userData.photoURL}
											alt={userData.name}
										/>
										{/* <EmojiPicker theme="light" suggestedEmojisMode="false" /> */}
									</div>
								</div>
							)}
							<div>
								<div className={styles.name}>
									{!editName ? (
										<>
											<h3>{userData.name}</h3>
											<button
												className={styles.editButton}
												type="submit"
												onClick={() =>
													setEditName(true)
												}
											>
												<span
													className={`${"material-symbols-rounded"}`}
												>
													&#xe3c9;
												</span>
											</button>
										</>
									) : (
										<form>
											<input
												type="text"
												placeholder={userData.name}
												value={name}
												className={styles.input}
												onChange={(e) =>
													setName(e.target.value)
												}
											/>
											<button
												className={styles.editButton}
												type="submit"
												onClick={() =>
													setEditName(false)
												}
											>
												<span
													className={`${"material-symbols-rounded"}`}
												>
													&#xe5c9;
												</span>
											</button>
											<button
												className={styles.editButton}
												type="submit"
												onClick={() =>
													setEditName(false)
												}
											>
												<span
													className={`${"material-symbols-rounded"}`}
												>
													&#xe161;
												</span>
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
				<button
					className={styles.logout}
					onClick={() => openModal("logout")}
				>
					<span className={`${"material-symbols-rounded"}`}>
						&#xe9ba;
					</span>
					Log Out
				</button>
				{showLogoutModal && (
					<div
						className={`${styles.modalContainer} ${
							modalFade ? styles.fade : ""
						} ${isMobile && styles.mobileModal}`}
						onClick={closeModal}
					>
						<div
							className={`${styles.modalContent} ${
								modalFade ? styles.slide : ""
							}`}
							onClick={(e) => e.stopPropagation()}
						>
							<h3>Log Out</h3>
							<p>Are you sure you want to log out?</p>
							<div>
								<button onClick={closeModal}>Cancel</button>
								<button
									className={styles.logout}
									onClick={logout}
								>
									<span
										className={`${"material-symbols-rounded"}`}
									>
										&#xe9ba;
									</span>
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
