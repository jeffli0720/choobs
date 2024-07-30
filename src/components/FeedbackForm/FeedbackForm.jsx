import styles from "./FeedbackForm.module.css";
import { useEffect, useState } from "react";
import { db } from "../../firebase.js";
import { doc, getDoc } from "firebase/firestore";

function FeedbackForm(props) {
	const uid = props.uid;
	const [showModal, setShowModal] = useState(false);
	const [modalFade, setModalFade] = useState(true);
	const [userData, setUserData] = useState();

	const [isMobile, setIsMobile] = useState(isMobileDevice());

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				if (sessionStorage.getItem("userData")) {
					setUserData(JSON.parse(sessionStorage.getItem("userData")));
				} else {
					const userRef = doc(db, "users", uid);
					console.log("[FeedbackForm] fetchUserData");
					const userDataSnapshot = await getDoc(userRef);
					const userData = userDataSnapshot.data();

					if (userData) {
						sessionStorage.setItem(
							"userData",
							JSON.stringify({
								email: userData.email,
								name: userData.name,
								pfp: userData.pfp,
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
	}, [uid, isMobile]);

	const openModal = () => {
		setModalFade(true);
		setShowModal(true);
	};

	const closeModal = () => {
		setModalFade(false);
		const timeoutId = setTimeout(() => {
			setShowModal(false);
		}, 200);

		return () => clearTimeout(timeoutId);
	};

	async function Submit(e) {
		e.preventDefault();
		if (document.querySelector("textarea").value.trim() !== "") {
			const formEle = document.querySelector("form");
			const formDatab = new FormData(formEle);

			formDatab.set("name", userData.name);
			formDatab.set("email", userData.email);
			formDatab.set("uid", uid);

			fetch("https://script.google.com/macros/s/AKfycbzphgkALt2G8jUwN2c1YYq7kvLyLpMlXsiszJ3xWs9N3Ts5V5eT8zA2x7pFSfe0htKu0w/exec", {
				method: "POST",
				body: formDatab,
			})
				.then((res) => res.json())
				.then((data) => {
					console.log(data);
				})
				.catch((error) => {
					console.error(error);
				});
			closeModal();
		}
	}

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
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && showModal) {
				closeModal();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showModal]);

	return (
		<>
			<div className={`${styles.feedbackButton}${isMobile ? " " + styles.mobile : ""}`}>
				<button onClick={openModal}>{!isMobile ? `Send Feedback` : <span className={`${"material-symbols-rounded"} ${styles.icon}`}>&#xf054;</span>}</button>
			</div>
			{showModal && (
				<div className={`${styles.modalContainer} ${modalFade ? styles.fade : ""}`} onClick={closeModal}>
					<div className={`${styles.modalContent} ${modalFade ? styles.slide : ""}`} onClick={(e) => e.stopPropagation()}>
						<form className={styles.form}>
							<h3>Got feedback or questions?</h3>
							<textarea placeholder="Start typing..." name="Message" type="text" />
							<button onClick={(e) => Submit(e)}>Submit</button>
						</form>
					</div>
				</div>
			)}
		</>
	);
}

export default FeedbackForm;
