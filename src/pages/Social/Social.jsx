import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebase";
import {
	getDoc,
	doc,
	updateDoc,
	deleteField,
	collection,
	getDocs,
} from "firebase/firestore";
// import axios from "axios";

import Schedule from "../Schedule/Schedule";

import styles from "./Social.module.css";

function Social() {
	const [uid, setUid] = useState("");
	const [friendData, setFriendData] = useState();
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [modalFade, setModalFade] = useState(true);
	const [searchedUser, setSearchedUser] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [activeSearch, setActiveSearch] = useState(false);

	// const [events, setEvents] = useState([]);
	const [displayDate, setDisplayDate] = useState(
		// 	new Date("2024-01-08T13:05:00")
		// );
		() => {
			const date = new Date();
			date.setHours(0, 0, 0, 0);
			return date;
		});
	// const [activeEvents, setActiveEvents] = useState([]);

	const [friendScheduleUID, setFriendScheduleUID] = useState();

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
		const auth = getAuth();
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUid(user.uid);
			}
		});

		return () => unsubscribe();
	}, []);

	const refreshFriendData = useCallback(async () => {
		try {
			const userRef = doc(db, "users", uid);
			const dataSnapshot = (await getDoc(userRef)).data();

			if (dataSnapshot.friends) {
				const friendDataPromises = Object.entries(
					dataSnapshot.friends
				).map(async ([friendUID, status, photo]) => {
					const friendUserRef = doc(db, "users", friendUID);
					const friendDataSnapshot = await getDoc(friendUserRef);
					const friendName = friendDataSnapshot.data().name;
					const friendPhoto = friendDataSnapshot.data().photoURL;

					return [friendName, friendUID, status, friendPhoto];
				});

				const friendData = await Promise.all(friendDataPromises);

				setFriendData(friendData);
			}

			setLoading(false);
		} catch (error) {
			console.error("Error fetching friend data:", error);
		}
	}, [uid]);

	// useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		refreshFriendData();
	// 	}, 1000); // Update every second

	// 	return () => {
	// 		clearInterval(interval);
	// 	};
	// });

	useEffect(() => {
		if (uid) {
			refreshFriendData();
		}
	}, [refreshFriendData, uid]);

	const openModal = () => {
		refreshFriendData();

		setModalFade(true);
		setShowModal(true);
	};

	const closeModal = () => {
		setModalFade(false);
		const timeoutId = setTimeout(() => {
			setShowModal(false);
			setSearchedUser("");
			setActiveSearch(false);
		}, 200);

		return () => clearTimeout(timeoutId);
	};

	const dismissRequest = async (friendUID, ignore) => {
		try {
			updateDoc(doc(db, "users", uid), {
				[`friends.${friendUID}`]: deleteField(),
			});

			if (!ignore) {
				updateDoc(doc(db, "users", friendUID), {
					[`friends.${uid}`]: deleteField(),
				});
			}

			refreshFriendData();
		} catch (error) {
			console.error("Error deleting", friendUID, error);
		}
	};

	const acceptRequest = (friendUID) => {
		try {
			updateDoc(doc(db, "users", uid), {
				[`friends.${friendUID}`]: 0,
			});

			updateDoc(doc(db, "users", friendUID), {
				[`friends.${uid}`]: 0,
			});

			refreshFriendData();
		} catch (error) {
			console.error("Error accepting", friendUID, error);
		}
	};

	const sendRequest = async (friendUID) => {
		try {
			updateDoc(doc(db, "users", uid), {
				[`friends.${friendUID}`]: 2,
			});

			updateDoc(doc(db, "users", friendUID), {
				[`friends.${uid}`]: 1,
			});

			fetch(
				"https://script.google.com/a/macros/lexingtonma.org/s/AKfycbxjylH8GOl-3YsNzMn03j5MwkMaCDWWf6t2jhYOt9ZjY776CHYJWF8deJ-THuQx_ILPgg/exec",
				{
					method: "POST",
					mode: "no-cors",
					body: JSON.stringify({ "sender": "alice", "recipientEmail": "26stu252@lexingtonma.org" }),
				}
			)
				.then((res) => res.json())
				.then((data) => {
					console.log(data);
				})
				.catch((error) => {
					console.error(error);
				});

			await refreshFriendData();
			setActiveSearch(false);
		} catch (error) {
			console.error("Error sending request to", friendUID, error);
		}
	};

	const unfriend = (friendUID) => {
		setFriendScheduleUID(null);
		closeModal();
		dismissRequest(friendUID, false);
	};

	const handleSearch = useCallback(
		async (e) => {
			if (e) {
				e.preventDefault();
			}

			if (searchedUser.trim() === "") {
				setActiveSearch(false);
				setSearchResults([]);
				return;
			}

			const querySnapshot = await getDocs(collection(db, "users"));

			const results = [];

			querySnapshot.forEach((doc) => {
				if (
					(doc
						.data()
						.name.toLowerCase()
						.includes(searchedUser.toLowerCase()) ||
						doc
							.data()
							.email.toLowerCase()
							.substring(
								0,
								doc.data().email.toLowerCase().indexOf("@")
							)
							.includes(searchedUser.toLowerCase())) &&
					!friendData.some((friend) => friend[1] === doc.id) &&
					doc.id !== uid
				) {
					results.push([
						doc.data().name,
						doc.data().email,
						doc.id,
						doc.data().photoURL,
					]);
				}
			});

			setActiveSearch(true);
			setSearchResults(results);
		},
		[friendData, searchedUser, uid]
	);

	useEffect(() => {
		setActiveSearch(false);
	}, [searchedUser]);

	// useEffect(() => {
	// 	console.log(friendData);
	// }, [friendData]);

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

	// useEffect(() => {
	// 	const fetchData = async () => {
	// 		setLoading(true);
	// 		try {
	// 			const response = await axios.get(
	// 				"https://www.googleapis.com/calendar/v3/calendars/lexingtonma.org_qud45cvitftvgc317tsd2vqctg%40group.calendar.google.com/events",
	// 				{
	// 					params: {
	// 						calendarId:
	// 							"lexingtonma.org_qud45cvitftvgc317tsd2vqctg@group.calendar.google.com",
	// 						singleEvents: true,
	// 						timeZone: "America/New_York",
	// 						maxResults: 20,
	// 						timeMin: `${
	// 							displayDate.toISOString().split("T")[0]
	// 						}T04:00:00-04:00`,
	// 						timeMax: `${
	// 							displayDate.toISOString().split("T")[0]
	// 						}T23:59:59-04:00`,
	// 						key: "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs",
	// 					},
	// 				}
	// 			);

	// 			const currentDayEvents = response.data.items.filter((event) => {
	// 				const eventStartDate = new Date(
	// 					event.start.dateTime || event.start.date
	// 				);
	// 				const isFullDayEvent =
	// 					!event.start.dateTime && !event.end.dateTime;

	// 				return (
	// 					(eventStartDate.getDate() === displayDate.getDate() &&
	// 						eventStartDate.getMonth() ===
	// 							displayDate.getMonth() &&
	// 						eventStartDate.getFullYear() ===
	// 							displayDate.getFullYear()) ||
	// 					isFullDayEvent
	// 				);
	// 			});
	// 			setEvents(currentDayEvents);
	// 		} catch (error) {
	// 			console.error("Error fetching calendar events:", error);
	// 		}
	// 	};

	// 	fetchData();
	// }, [displayDate]);

	useEffect(() => {
		if (displayDate.getTime() !== new Date().setHours(0, 0, 0, 0)) {
			const interval = setInterval(() => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				setDisplayDate(date);
			}, 4 * 60 * 60 * 1000); // 4 hours in milliseconds

			return () => {
				// Clear the interval when the component unmounts
				clearInterval(interval);
			};
		}
	}, [displayDate]);

	// useEffect(() => {
	// 	const interval = setInterval(() => {
	// 		const isHighlightedEvent = (event) => {
	// 			const startTime = new Date(event.start.dateTime);
	// 			const endTime = new Date(event.end.dateTime);
	// 			const currentTime = new Date(); //new Date();

	// 			if (event.summary.includes("Lunch")) {
	// 				return (
	// 					currentTime >= startTime.getTime() &&
	// 					currentTime <= endTime.getTime()
	// 				);
	// 			} else {
	// 				return (
	// 					currentTime >= startTime.getTime() - 5 * 60 * 1000 &&
	// 					currentTime <= endTime.getTime()
	// 				);
	// 			}
	// 		};

	// 		setActiveEvents(
	// 			events.filter((event) => isHighlightedEvent(event))
	// 		);
	// 	}, 1000); // Update every second

	// 	// Clean up the interval on component unmount
	// 	return () => clearInterval(interval);

	// 	// Include dependencies in the array if needed
	// }, [events, displayDate, setActiveEvents]);

	// const friendHasClass = async (event, uid) => {
	// 	const userRef = doc(db, "users", uid);
	// 	const scheduleDataSnapshot = (await getDoc(userRef)).data();

	// 	// Extract the 'classes' data from the snapshot
	// 	const classesData = scheduleDataSnapshot.classes;

	// 	// Map the 'classes' data into the 'scheduleData' array
	// 	const scheduleData = Object.entries(classesData).map(
	// 		([block, classNames]) => ({
	// 			block,
	// 			classNames,
	// 		})
	// 	);

	// 	// console.log(scheduleData);
	// 	// console.log(event.summary);
	// 	// console.log(scheduleData.some((item) => item.block === event.summary));

	// 	return scheduleData.some((item) => item.block === event.summary);
	// };

	return (
		<>
			<div
				className={`${isMobile ? styles.header : styles.desktopHeader
					} ${friendScheduleUID ? styles.active : ""}`}
			>
				{!friendScheduleUID ? (
					<div>
						<div>
							<h3>Friends</h3>
						</div>
						<button
							className={styles.button}
							onClick={openModal}
							disabled={loading}
						>
							{friendData &&
								friendData.some((item) => item[2] === 1) ? (
								<span
									className={`${"material-symbols-rounded"}`}
								>
									&#xe7f0;
									<div
										className={styles.requestNotification}
									/>
								</span>
							) : (
								<span
									className={`${"material-symbols-rounded"}`}
								>
									&#xe7f0;
								</span>
							)}
						</button>
					</div>
				) : (
					<>
						<div>
							<button
								className={styles.button}
								onClick={() => setFriendScheduleUID(null)}
							>
								<span
									className={`${"material-symbols-rounded"}`}
								>
									&#xe5cb;
								</span>
							</button>
							<div className={styles.currentlyViewing}>
								Currently viewing
								<h4>
									{
										friendData.find(
											(friend) =>
												friend[1] === friendScheduleUID
										)[0]
									}
								</h4>
							</div>
							<button
								className={styles.button}
								onClick={openModal}
							>
								<span
									className={`${"material-symbols-rounded"}`}
								>
									&#xe872;
								</span>
							</button>
						</div>
					</>
				)}
			</div>
			{showModal && friendScheduleUID && (
				<div
					className={`${styles.modalContainer} ${modalFade && styles.fade
						} ${isMobile && styles.mobileModal} ${styles.unfriendModal
						}`}
					onClick={closeModal}
				>
					<div
						className={`${styles.modalContent} ${modalFade ? styles.slide : ""
							}`}
						onClick={(e) => e.stopPropagation()}
					>
						<h3>
							Unfriend{" "}
							{
								friendData.find(
									(friend) => friend[1] === friendScheduleUID
								)[0]
							}
						</h3>
						<p>
							Are you sure you want to remove{" "}
							{
								friendData.find(
									(friend) => friend[1] === friendScheduleUID
								)[0]
							}{" "}
							from your friends list?
						</p>
						<div>
							<button onClick={closeModal}>Cancel</button>
							<button onClick={() => unfriend(friendScheduleUID)}>
								Unfriend{" "}
								{
									friendData.find(
										(friend) =>
											friend[1] === friendScheduleUID
									)[0]
								}
							</button>
						</div>
					</div>
				</div>
			)}
			<div
				className={`${isMobile ? styles.social : styles.desktopSocial
					} ${friendScheduleUID ? styles.ios : ""}`}
			>
				{!friendScheduleUID ? (
					<div className={styles.friendsList}>
						{loading ? (
							<div className={`lds-ring ${styles.loadingRing}`}>
								<div></div>
								<div></div>
								<div></div>
								<div></div>
							</div>
						) : friendData &&
							friendData.some((item) => item[2] === 0) ? (
							friendData
								.sort((a, b) => {
									return friendData
										.find((friend) => friend[1] === a[1])[0]
										.localeCompare(
											friendData.find(
												(friend) => friend[1] === b[1]
											)[0]
										);
								})
								.filter((friend) => {
									return friend[2] === 0;
								})
								.map((friend) => {
									return (
										<button
											key={friend[1]}
											className={`${styles.friendItem} ${styles.button}`}
											onClick={() => {
												setFriendScheduleUID(friend[1]);
											}}
										>
											<div className={styles.friendInfo}>
												<img
													src={
														friend[3]
															? friend[3]
															: `${process.env
																.PUBLIC_URL +
															"/static/maskable_icon_x144.png"
															}`
													}
													alt={friend[0]}
												></img>
												<div>
													<h4>{friend[0]}</h4>
													{/* {activeEvents
														.filter(
															async (event) => {
																return await friendHasClass(
																	event, friend[1]
																);
															}
														)
														.map((event) => {
															return (
																<span
																	key={
																		event.summary
																	}
																>
																	{
																		event.summary
																	}
																</span>
															);
														})
													} */}
												</div>
											</div>

											<span
												className={`${"material-symbols-rounded"}`}
											>
												&#xe5cc;
											</span>
										</button>
									);
								})
						) : (
							<div className={styles.noFriends}>
								<h3>Scheduling is better with friends!</h3>
								<p>
									Invite your friends to sign up at{" "}
									<span>choobs.app</span> and send them a
									friend request using the button in the top
									right.
								</p>
							</div>
						)}
					</div>
				) : (
					<div className={styles.scheduleContainer}>
						<Schedule uid={friendScheduleUID} />
					</div>
				)}
			</div>
			{showModal && !friendScheduleUID && (
				<div
					className={`${styles.modalContainer} ${modalFade && styles.fade
						} ${isMobile && styles.mobileModal}`}
					onClick={closeModal}
				>
					<div
						className={`${styles.modalContent} ${modalFade ? styles.slide : ""
							}`}
						onClick={(e) => e.stopPropagation()}
					>
						<div>
							<h3>Add friends</h3>
							<div className={styles.searchBox}>
								<form
									onSubmit={(e) => {
										handleSearch(e);
									}}
								>
									<input
										type="text"
										name="searchBox"
										placeholder="Search by name or email..."
										value={searchedUser}
										className={styles.input}
										autoComplete="off"
										onChange={(e) =>
											setSearchedUser(e.target.value)
										}
									/>
									<button type="submit">
										<span
											className={`${"material-symbols-rounded"}`}
										>
											&#xe8b6;
										</span>
									</button>
								</form>
							</div>
						</div>
						{activeSearch && (
							<div className={styles.pendingFriends}>
								{searchResults.length > 0 ? (
									searchResults.map((user) => (
										<div
											key={user[1]}
											className={styles.searchedFriend}
										>
											<div>
												<img
													src={
														user[3]
															? user[3]
															: `${process.env
																.PUBLIC_URL +
															"/static/maskable_icon_x144.png"
															}`
													}
													alt={user[0]}
												></img>
												<div>
													<span>{user[0]}</span>
													<span>{user[1]}</span>
												</div>
											</div>
											<button
												onClick={() => {
													sendRequest(user[2]);
												}}
											>
												<span
													className={`${"material-symbols-rounded"}`}
												>
													&#xe7f0;
												</span>
												Add
											</button>
										</div>
									))
								) : (
									<>No matches found for "{searchedUser}"</>
								)}
							</div>
						)}
						{friendData.some((item) => item[2] === 1) && (
							<div className={styles.pendingFriends}>
								<h3>Incoming requests</h3>
								{friendData
									.sort((a, b) => {
										return friendData
											.find(
												(friend) => friend[1] === a[1]
											)[0]
											.localeCompare(
												friendData.find(
													(friend) =>
														friend[1] === b[1]
												)[0]
											);
									})
									.filter((friend) => {
										return friend[2] === 1;
									})
									.map((friend) => {
										return (
											<div
												className={styles.pendingFriend}
												key={friend[1]}
											>
												<div>
													<div>{friend[0]}</div>
												</div>
												<div className={styles.buttons}>
													<button
														onClick={() =>
															dismissRequest(
																friend[1],
																true
															)
														}
													>
														Ignore
													</button>
													<button
														onClick={() =>
															acceptRequest(
																friend[1]
															)
														}
													>
														Accept
													</button>
												</div>
											</div>
										);
									})}
							</div>
						)}
						{friendData.some((item) => item[2] === 2) && (
							<div className={styles.pendingFriends}>
								<h3>Outgoing requests</h3>
								{friendData
									.sort((a, b) => {
										return friendData
											.find(
												(friend) => friend[1] === a[1]
											)[0]
											.localeCompare(
												friendData.find(
													(friend) =>
														friend[1] === b[1]
												)[0]
											);
									})
									.filter((friend) => {
										return friend[2] === 2;
									})
									.map((friend) => {
										return (
											<div
												className={styles.pendingFriend}
												key={friend[1]}
											>
												<div>
													<div>{friend[0]}</div>
												</div>
												<div className={styles.buttons}>
													<button
														onClick={() =>
															dismissRequest(
																friend[1],
																false
															)
														}
													>
														Cancel
													</button>
												</div>
											</div>
										);
									})}
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}

export default Social;
