import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import { getDoc, doc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "./EditClasses.module.css";

function EditClasses() {
	const [subject, setSubject] = useState("");
	const [roomNumber, setRoomNumber] = useState("");
	const [uid, setUid] = useState("");
	const [selectedClasses, setSelectedClasses] = useState([]);
	const [showClassesModal, setShowClassesModal] = useState(false);
	const [modalFade, setModalFade] = useState(true);
	const [scheduleData, setScheduleData] = useState([]);
	const [deleteMode, setDeleteMode] = useState(false);
	const [previouslySelected, setPreviouslySelected] = useState([]);

	const schedule = {
		1: ["A1", "B1", "C1", "C$1", "D1", "D$1", "E1", "F1"],
		2: ["E2", "F2", "G1", "G$1", "H1", "H$1", "Adv", "D2"],
		3: ["B2", "A2", "G2", "G$2", "H2", "H$2", "I", "C2"],
		4: ["A3", "B3", "C3", "C$3", "D3", "D$3", "E3", "F3"],
		5: ["E4", "F4", "G3", "G$3", "H3", "H$3", "I", "D4"],
		6: ["B4", "A4", "G4", "G$4", "H4", "H$4", "I", "C4"],
	};

	const lunchBlocks = useMemo(() => ["C1", "C$1", "G1", "G$1", "G2", "G$2", "C3", "C$3", "G3", "G$3", "G4", "G$4", "D1", "D$1", "H1", "H$1", "H2", "H$2", "D3", "D$3", "H3", "H$3", "H4", "H$4"], []);

	useEffect(() => {
		const auth = getAuth();
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUid(user.uid);
			}
		});

		return () => unsubscribe();
	}, []);

	const addData = async () => {
		if (selectedClasses.length > 0) {
			try {
				const auth = getAuth();
				const user = await new Promise((resolve, reject) => {
					const unsubscribe = onAuthStateChanged(
						auth,
						(user) => {
							unsubscribe();
							resolve(user);
						},
						reject
					);
				});

				const uid = user.uid;

				if (subject) {
					const operations = selectedClasses.map(async (block) => {
						// console.log(block, subject, roomNumber);

						const classes = new Map();
						classes.set(block, [subject.trim(), roomNumber.trim()]);
						// console.log(classes);

						const classesObject = Object.fromEntries(classes);

						await setDoc(doc(db, "users", uid), { classes: classesObject }, { merge: true });

						console.log("Added", block);
					});

					await Promise.all(operations);
				}

				let classesToDelete;

				if (subject) {
					classesToDelete = previouslySelected.filter((id) => !selectedClasses.includes(id));
					classesToDelete.push(
						...selectedClasses
							.filter((id) => lunchBlocks.includes(id))
							.flatMap((id) => {
								const correspondingElement = id.includes("$") ? id.replace(/\$/, "") : id.slice(0, 1) + "$" + id.slice(1);
								if (["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id) > -1) {
									return [correspondingElement, ["D1", "H1", "H2", "D3", "H3", "H4"][["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id)]];
								}
								if (["D1", "H1", "H2", "D3", "H3", "H4"].indexOf(id) > -1) {
									return [correspondingElement, ["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"][["D1", "H1", "H2", "D3", "H3", "H4"].indexOf(id)]];
								}
								return correspondingElement;
							})
					);
					classesToDelete = [
						...new Set(
							classesToDelete.filter((id) => {
								return scheduleData.some((data) => data.block === id);
							})
						),
					];
				} else {
					// If there's no subject, delete everything in the selectedClasses array
					classesToDelete = selectedClasses;
				}

				if (classesToDelete.length > 0) {
					const deleteOperations = classesToDelete.map(async (block) => {
						const docRef = doc(db, "users", uid);

						await updateDoc(docRef, {
							[`classes.${block}`]: deleteField(),
						});

						console.log("Deleted", block);
					});

					await Promise.all(deleteOperations);
				}

				await refreshScheduleData();

				setSubject("");
				setRoomNumber("");
				setSelectedClasses([]);
				setShowClassesModal(false);
			} catch (error) {
				console.error("Error adding/deleting documents: ", error);
			}
		}
	};

	useEffect(() => {
		if (selectedClasses.length > 0 && !subject) {
			setDeleteMode(true);
		} else {
			setDeleteMode(false);
		}
	}, [selectedClasses, subject]);

	const refreshScheduleData = async () => {
		try {
			if (uid) {
				const userRef = doc(db, "users", uid);
				const scheduleDataSnapshot = (await getDoc(userRef)).data();

				// Extract the 'classes' data from the snapshot
				const classesData = scheduleDataSnapshot.classes;

				// Map the 'classes' data into the 'scheduleData' array
				const scheduleData = Object.entries(classesData).map(([block, classNames]) => ({
					block,
					classNames,
				}));

				sessionStorage.setItem("scheduleData", JSON.stringify(scheduleData));

				setScheduleData(scheduleData);
			}
		} catch (error) {
			console.error("Error fetching schedule data:", error);
		}
	};

	useEffect(() => {
		const fetchScheduleData = async () => {
			try {
				if (sessionStorage.getItem("scheduleData")) {
					setScheduleData(JSON.parse(sessionStorage.getItem("scheduleData")));
				} else {
					const userRef = doc(db, "users", uid);
					const scheduleDataSnapshot = (await getDoc(userRef)).data();

					// Extract the 'classes' data from the snapshot
					const classesData = scheduleDataSnapshot.classes;

					// Map the 'classes' data into the 'scheduleData' array
					const scheduleData = Object.entries(classesData).map(([block, classNames]) => ({
						block,
						classNames,
					}));

					sessionStorage.setItem("scheduleData", JSON.stringify(scheduleData));

					setScheduleData(scheduleData);
				}
			} catch (error) {
				console.error("Error fetching schedule data:", error);
			}
		};

		if (uid) {
			fetchScheduleData();
		}
	}, [uid]);

	const handleBlockSelect = (id) => {
		// console.log(id);
		setSelectedClasses((prevSelected) => {
			if (prevSelected.includes(id)) {
				return prevSelected.filter((item) => item !== id);
			} else {
				return [...prevSelected, id];
			}
		});
	};

	const renderSchedule = () => {
		const blocks = [];

		Object.entries(schedule).forEach(([day, column]) => {
			const dayBlocks = column.map((id) => {
				const matchingData = scheduleData.find((data) => data.block.includes(id));
				const isDisabled = () => {
					if (["Adv", "I"].includes(id)) {
						return true;
					} else if (lunchBlocks.includes(id)) {
						const correspondingElements = id.includes("$") ? [id.replace(/\$/, "")] : [id.slice(0, 1) + "$" + id.slice(1)];
						if (["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id) > -1) {
							correspondingElements.push(["D1", "H1", "H2", "D3", "H3", "H4"][["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id)]);
						}
						if (["D1", "H1", "H2", "D3", "H3", "H4"].indexOf(id) > -1) {
							correspondingElements.push(["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"][["D1", "H1", "H2", "D3", "H3", "H4"].indexOf(id)]);
						}
						return correspondingElements.some((element) => scheduleData.some((block) => block.block === element));
					}
					return false;
				};
				return (
					<button
						key={id}
						className={`${styles.scheduleItem}${!matchingData && !isDisabled() ? ` ${styles.missingData}` : ""}`}
						disabled={isDisabled()}
						onClick={() => {
							openModal(id);
						}}
					>
						{matchingData ? <p>{matchingData.classNames[0]}</p> : <p />}
						<i>{id + ""}</i>
					</button>
				);
			});

			blocks.push(
				<div key={day} className={styles.column}>
					{dayBlocks}
				</div>
			);
		});

		return (
			<div className={styles.table}>
				<div className={`${styles.column} ${styles.labels}`}>
					<div>1</div>
					<div>2</div>
					<div>
						3<span>a</span>
					</div>
					<div>
						3<span>b</span>
					</div>
					<div>
						4<span>a</span>
					</div>
					<div>
						4<span>b</span>
					</div>
					<div>5</div>
					<div>6</div>
				</div>
				{blocks}
			</div>
		);
	};

	useEffect(() => {
		lunchBlocks.forEach((id) => {
			const correspondingElement = id.includes("$") ? document.getElementById(id.replace(/\$/, "")) : document.getElementById(id.slice(0, 1) + "$" + id.slice(1));
			if (selectedClasses.includes(id)) {
				if (correspondingElement) {
					correspondingElement.disabled = true;
					correspondingElement.classList.add(styles.disabled);
					if (["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id) > -1) {
						let index = ["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id);
						document.getElementById(["D1", "H1", "H2", "D3", "H3", "H4"][index]).disabled = true;
						document.getElementById(["D1", "H1", "H2", "D3", "H3", "H4"][index]).classList.add(styles.disabled);
					}
					if (["D1", "H1", "H2", "D3", "H3", "H4"].indexOf(id) > -1) {
						let index = ["D1", "H1", "H2", "D3", "H3", "H4"].indexOf(id);
						document.getElementById(["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"][index]).disabled = true;
						document.getElementById(["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"][index]).classList.add(styles.disabled);
					}
				}
			} else {
				if (correspondingElement) {
					if (!["D$1", "H$1", "H$2", "D$3", "H$3", "H$4"].includes(id)) {
						if (["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].includes(id)) {
							let index = ["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].indexOf(id);
							document.getElementById(["D1", "H1", "H2", "D3", "H3", "H4"][index]).disabled = false;
							document.getElementById(["D1", "H1", "H2", "D3", "H3", "H4"][index]).classList.remove(styles.disabled);
						}
						correspondingElement.disabled = false;
						correspondingElement.classList.remove(styles.disabled);
					} else if (["C$1", "G$1", "G$2", "C$3", "G$3", "G$4"].every((id) => !selectedClasses.includes(id))) {
						correspondingElement.disabled = false;
						correspondingElement.classList.remove(styles.disabled);
					}
				}
			}
		});
	}, [selectedClasses, lunchBlocks]);

	const renderModalSchedule = () => {
		const buttons = [];

		Object.entries(schedule).forEach(([day, column]) => {
			const dayButtons = column.map((id) => {
				const isSelected = selectedClasses.includes(id);
				var isDisabled = id === "I" || id === "Adv";
				return (
					<button
						key={id}
						id={id}
						className={`${styles.cell}${isSelected ? ` ${styles.selected}` : ""} ${isDisabled ? ` ${styles.disabled}` : ""}`}
						onClick={() => handleBlockSelect(id)}
						disabled={isDisabled}
					>
						{id}
					</button>
				);
			});

			buttons.push(
				<div key={day} className={styles.column}>
					<div>{day}</div>
					{dayButtons}
				</div>
			);
		});

		return <div className={styles.table}>{buttons}</div>;
	};

	const openModal = (id) => {
		const matchingData = scheduleData.find((data) => data.block.includes(id));
		// console.log(id, matchingData);
		if (matchingData) {
			// console.log(matchingData);
			setSubject(matchingData.classNames[0]);
			setRoomNumber(matchingData.classNames[1]);
			setPreviouslySelected(
				[].concat(...scheduleData.filter((item) => item.classNames[0] === matchingData.classNames[0] && item.classNames[1] === matchingData.classNames[1]).map((item) => item.block))
			);
			setSelectedClasses(
				[].concat(...scheduleData.filter((item) => item.classNames[0] === matchingData.classNames[0] && item.classNames[1] === matchingData.classNames[1]).map((item) => item.block))
			);
		} else {
			setPreviouslySelected([id]);
			if (id) {
				setSelectedClasses([id]);
			}
		}
		setModalFade(true);
		setShowClassesModal(true);
	};

	const closeModal = () => {
		setModalFade(false);
		const timeoutId = setTimeout(() => {
			setShowClassesModal(false);
			setSubject("");
			setRoomNumber("");
			setSelectedClasses([]);
		}, 200);

		return () => clearTimeout(timeoutId);
	};

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && showClassesModal) {
				closeModal();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showClassesModal]);

	return (
		<>
			<div className={styles.editClasses}>
				<div>
					<h3>Edit Classes</h3>
					<span className={styles.subtext}>Click a block to begin editing.</span>
				</div>
				<div className={styles.schedule}>
					<div className={styles.dayLabels}>
						<span className={styles.labels} />
						<span>D1</span>
						<span>D2</span>
						<span>D3</span>
						<span>D4</span>
						<span>D5</span>
						<span>D6</span>
					</div>
					{renderSchedule()}
				</div>
				{showClassesModal && (
					<div className={`${styles.modalContainer} ${modalFade ? styles.fade : ""}`} onClick={closeModal}>
						<div className={`${styles.modalContent}`} onClick={(e) => e.stopPropagation()}>
							<h3 className={styles.modalTitle}>Edit Classes</h3>
							<div>
								<div>
									<div className={styles.inputs}>
										<input type="text" value={subject} id="subject" placeholder="Subject" autoComplete="off" onChange={(e) => setSubject(e.target.value)} />
										<input type="text" value={roomNumber} id="room" placeholder="Room Number" autoComplete="off" onChange={(e) => setRoomNumber(e.target.value)} />
									</div>
									<div className={styles.subtext}>Leave subject empty to delete blocks.</div>
								</div>
								<div>{renderModalSchedule()}</div>
								<div className={styles.buttons}>
									<button
										onClick={() => {
											setSelectedClasses([]);
											setSubject("");
											setRoomNumber("");
										}}
									>
										Clear Selection
									</button>
									<button onClick={addData}>{deleteMode ? "Delete Data" : "Update Data"}</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default EditClasses;
