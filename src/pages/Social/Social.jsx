import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { db } from "../../firebase";
import { getDoc, doc, updateDoc, deleteField, collection, getDocs } from "firebase/firestore";
import axios from "axios";

import Schedule from "../Schedule/Schedule";
import PFP from "../../components/PFP/PFP";

import styles from "./Social.module.css";

function Social() {
	const [uid, setUid] = useState("");
	const [friendData, setFriendData] = useState();
	const [loading, setLoading] = useState(true);

	const [showAddModal, setShowAddModal] = useState(false);
	const [addModalFade, setAddModalFade] = useState(true);

	const [showRemoveModal, setShowRemoveModal] = useState(false);
	const [removeModalFade, setRemoveModalFade] = useState(true);

	const [searchedUser, setSearchedUser] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [activeSearch, setActiveSearch] = useState(false);
	const [userData, setUserData] = useState();

	const [showMenu, setShowMenu] = useState(false);
	const [menuFade, setMenuFade] = useState(true);
	const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
	const menuRef = useRef();

	const [displayDate, setDisplayDate] = useState(() => {
		const date = new Date();
		date.setHours(0, 0, 0, 0);
		return date;
	});
	const [events, setEvents] = useState([]);
	const [activeBlocks, setActiveBlocks] = useState([]);
	const [friendSchedules, setFriendSchedules] = useState({});

	const [friendScheduleUID, setFriendScheduleUID] = useState();

	const [isMobile, setIsMobile] = useState(isMobileDevice());

	function isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				if (sessionStorage.getItem("userData")) {
					setUserData(JSON.parse(sessionStorage.getItem("userData")));
				} else {
					const userRef = doc(db, "users", uid);
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

	useEffect(() => {
		const fetchScheduleData = async () => {
			try {
				const querySnapshot = await getDocs(collection(db, "users"));
				querySnapshot.forEach((doc) => {
					if (friendData.some((friend) => friend[1] === doc.id && friend[2] === 0)) {
						const scheduleData = Object.entries(doc.data().classes).map(([block, classNames]) => ({
							block,
							classNames,
						}));

						setFriendSchedules((prevFriendSchedules) => ({
							...prevFriendSchedules,
							[doc.id]: scheduleData,
						}));
					}
				});
			} catch (error) {
				console.error("Error fetching schedule data:", error);
			}
		};

		const fetchData = async () => {
			try {
				const response = await axios.get("https://www.googleapis.com/calendar/v3/calendars/lexingtonma.org_qud45cvitftvgc317tsd2vqctg%40group.calendar.google.com/events", {
					params: {
						calendarId: "lexingtonma.org_qud45cvitftvgc317tsd2vqctg@group.calendar.google.com",
						singleEvents: true,
						timeZone: "America/New_York",
						maxResults: 20,
						timeMin: `${displayDate.toISOString().split("T")[0]}T04:00:00-04:00`,
						timeMax: `${displayDate.toISOString().split("T")[0]}T23:59:59-04:00`,
						key: "AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs",
					},
				});

				const currentDayEvents = response.data.items.filter((event) => {
					const eventStartDate = new Date(event.start.dateTime || event.start.date);
					const isFullDayEvent = !event.start.dateTime && !event.end.dateTime;

					return (
						(eventStartDate.getDate() === displayDate.getDate() && eventStartDate.getMonth() === displayDate.getMonth() && eventStartDate.getFullYear() === displayDate.getFullYear()) ||
						isFullDayEvent
					);
				});
				setEvents(currentDayEvents);
			} catch (error) {
				console.error("Error fetching calendar events:", error);
				fetchData();
			}
		};
		fetchData();

		if (friendData) {
			fetchScheduleData();
		}
	}, [displayDate, friendData]);

	useEffect(() => {
		const updateActiveBlocks = () => {
			const currentTime = new Date();
			const activeEvents = events.filter((event) => {
				const eventStartDate = new Date(event.start.dateTime);
				const eventEndDate = new Date(event.end.dateTime);

				if (event.summary.includes("Lunch")) {
					return currentTime >= eventStartDate && currentTime <= eventEndDate;
				} else {
					return currentTime >= new Date(eventStartDate.getTime() - 5 * 60 * 1000) && currentTime <= eventEndDate;
				}
			});

			setActiveBlocks(activeEvents);
		};

		const interval = setInterval(() => {
			updateActiveBlocks();
		}, 1000); // Update every second

		return () => {
			clearInterval(interval);
		};
	}, [events]);

	const refreshFriendData = useCallback(async () => {
		try {
			const userRef = doc(db, "users", uid);
			const dataSnapshot = (await getDoc(userRef)).data();

			if (dataSnapshot.friends) {
				const friendDataPromises = Object.entries(dataSnapshot.friends).map(async ([friendUID, status, photo]) => {
					const friendUserRef = doc(db, "users", friendUID);
					const friendDataSnapshot = await getDoc(friendUserRef);
					const friendName = friendDataSnapshot.data().name;
					const friendPhoto = friendDataSnapshot.data().pfp;

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

	useEffect(() => {
		if (uid) {
			refreshFriendData();
		}
	}, [refreshFriendData, uid]);

	const openModal = () => {
		refreshFriendData();

		if (showMenu) {
			setRemoveModalFade(true);
			setShowRemoveModal(showMenu);
		} else {
			setAddModalFade(true);
			setShowAddModal(true);
		}
	};

	const closeModal = () => {
		setRemoveModalFade(false);
		setAddModalFade(false);
		const timeout = setTimeout(() => {
			setShowRemoveModal(false);
			setShowAddModal(false);
			setSearchedUser("");
			setActiveSearch(false);
		}, 200);

		return () => clearTimeout(timeout);
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

			const friendRef = doc(db, "users", friendUID);
			const friendDataSnapshot = await getDoc(friendRef);
			const friendData = friendDataSnapshot.data();

			if (friendData.preferences.emailNotifications) {
				const formDatab = new FormData();

				formDatab.set("senderName", userData.name);
				formDatab.set("recipientName", friendData.name);
				formDatab.set("recipientEmail", friendData.email);

				fetch("https://script.google.com/macros/s/AKfycbyD-LlTav4EIE3bsIAigpf-54LR-S_X6E581Ua8Wi01RevWF2HvEeGXspuPGBlM-Ixu/exec", {
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
			}

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
					(doc.data().name.toLowerCase().includes(searchedUser.toLowerCase()) ||
						doc.data().email.toLowerCase().substring(0, doc.data().email.toLowerCase().indexOf("@")).includes(searchedUser.toLowerCase())) &&
					!friendData.some((friend) => friend[1] === doc.id) &&
					doc.id !== uid
				) {
					results.push([doc.data().name, doc.data().email, doc.id, doc.data().pfp]);
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

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && (showAddModal || showRemoveModal)) {
				closeModal();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showRemoveModal, showAddModal]);

	useEffect(() => {
		if (displayDate.getTime() !== new Date().setHours(0, 0, 0, 0)) {
			const interval = setInterval(() => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				setDisplayDate(date);
			}, 1000);

			return () => {
				// Clear the interval when the component unmounts
				clearInterval(interval);
			};
		}
	}, [displayDate]);

	const openMenu = (e, friend) => {
		e.stopPropagation();
		const buttonRect = e.target.getBoundingClientRect();
		setMenuPosition({
			top: buttonRect.top + window.scrollY,
			left: buttonRect.left - 9.5 * 16,
		});
		if (showMenu !== friend[1]) {
			setMenuFade(true);
			setShowMenu(friend[1]);
		} else {
			closeMenu();
		}
	};

	const closeMenu = () => {
		setMenuFade(false);
		const timeout = setTimeout(() => {
			setShowMenu(false);
		}, 200);

		return () => clearTimeout(timeout);
	};

	useEffect(() => {
		if (showMenu) {
			document.addEventListener("click", closeMenu);
		} else {
			document.removeEventListener("click", closeMenu);
		}

		return () => {
			document.removeEventListener("click", closeMenu);
		};
	}, [showMenu]);

	const pin = (friend) => {
		const friendUID = friend[1];
		try {
			if (friend[2] === 0) {
				updateDoc(doc(db, "users", uid), {
					[`friends.${friendUID}`]: 3,
				});
				window.scrollTo(0, 0);
			} else {
				updateDoc(doc(db, "users", uid), {
					[`friends.${friendUID}`]: 0,
				});
			}
			refreshFriendData();
			closeMenu();
		} catch (error) {
			console.error("Error pinning", friendUID, error);
		}
	};

	return (
		<>
			<div className={`${isMobile ? styles.header : styles.desktopHeader} ${friendScheduleUID ? styles.active : ""}`}>
				{!friendScheduleUID ? (
					<div>
						<div>
							{userData && <PFP pfp={userData.pfp} size={2.5} />}
							<h3>Friends</h3>
						</div>
						<button className={styles.button} onClick={openModal} disabled={loading}>
							{friendData && friendData.some((item) => item[2] === 1) ? (
								<span className={`${"material-symbols-rounded"}`}>
									&#xe7f0;
									<div className={styles.requestNotification} />
								</span>
							) : (
								<span className={`${"material-symbols-rounded"}`}>&#xe7f0;</span>
							)}
						</button>
					</div>
				) : (
					<>
						<div>
							<button className={styles.button} onClick={() => setFriendScheduleUID(null)}>
								<span className={`${"material-symbols-rounded"}`}>&#xe5cb;</span>
							</button>
							<div className={styles.currentlyViewing}>
								<h4>{friendData.find((friend) => friend[1] === friendScheduleUID)[0]}</h4>
							</div>
							<div />
						</div>
					</>
				)}
			</div>
			{showRemoveModal && (
				<div className={`${styles.modalContainer} ${removeModalFade && styles.fade} ${isMobile && styles.mobileModal} ${styles.unfriendModal}`} onClick={closeModal}>
					<div className={`${styles.modalContent} ${removeModalFade ? styles.slide : ""}`} onClick={(e) => e.stopPropagation()}>
						<h3>Unfriend {friendData.find((friend) => friend[1] === showRemoveModal)[0]}</h3>
						<p>Are you sure you want to remove {friendData.find((friend) => friend[1] === showRemoveModal)[0]} from your friends list?</p>
						<div>
							<button onClick={closeModal}>Cancel</button>
							<button onClick={() => unfriend(showRemoveModal)}>Unfriend {friendData.find((friend) => friend[1] === showRemoveModal)[0]}</button>
						</div>
					</div>
				</div>
			)}
			<div className={`${isMobile ? styles.social : styles.desktopSocial} ${friendScheduleUID ? styles.ios : ""}`}>
				{!friendScheduleUID ? (
					<div className={styles.friendsList}>
						{loading ? (
							<div className={`lds-ring ${styles.loadingRing}`}>
								<div></div>
								<div></div>
								<div></div>
								<div></div>
							</div>
						) : friendData && friendData.some((item) => item[2] === 0) ? (
							friendData
								.sort((a, b) => {
									if (a[2] === 3 && b[2] !== 3) return -1;
									if (a[2] !== 3 && b[2] === 3) return 1;
									return friendData.find((friend) => friend[1] === a[1])[0].localeCompare(friendData.find((friend) => friend[1] === b[1])[0]);
								})
								.filter((friend) => {
									return friend[2] === 0 || friend[2] === 3;
								})
								.map((friend) => {
									return (
										<React.Fragment key={friend[1]}>
											<button
												key={friend[1]}
												className={`${styles.friendItem} ${styles.button}`}
												onClick={() => {
													setFriendScheduleUID(friend[1]);
												}}
											>
												<div className={styles.friendInfo}>
													<PFP pfp={friend[3]} size={2.5} />
													{friend[2] === 3 && <div className={`${"material-symbols-rounded"} ${styles.pin}`}>&#xe6aa;</div>}
													<span>
														<h4>{friend[0]}</h4>
														{activeBlocks.length > 0 && (
															<span>
																{activeBlocks.map((block) => {
																	const currentTime = new Date();
																	let currently;
																	if (new Date(block.start.dateTime) > currentTime) {
																		currently = <>Heading to </>;
																	} else {
																		currently = <>Currently in </>;
																	}
																	if (!events[0].summary.includes("Half Day")) {
																		const className = friendSchedules[friend[1]].find((item) => item.block === block.summary);
																		if (className) {
																			return (
																				<React.Fragment key={block.summary}>
																					{currently}
																					<b key={block.summary}>{className.classNames[0]}</b>
																				</React.Fragment>
																			);
																		} else if (
																			(block.summary.includes("Lunch") || block.summary.includes("I-block") || block.summary.includes("Advisory")) &&
																			!friendSchedules[friend[1]].find((item) => activeBlocks.find((activeBlock) => activeBlock.summary === item.block))
																		) {
																			return (
																				<React.Fragment key={block.summary}>
																					{currently}
																					<b key={block.summary}>{block.summary}</b>
																				</React.Fragment>
																			);
																		}
																	} else {
																		const className =
																			friendSchedules[friend[1]].find((item) => item.block === block.summary.replace(/([A-Z])(\d)/, "$1$$$2")) ||
																			friendSchedules[friend[1]].find((item) => item.block === block.summary.replace("$", ""));
																		console.log(className);
																		if (className) {
																			return (
																				<React.Fragment key={block.summary}>
																					{currently}
																					<b key={block.summary}>{className.classNames[0]}</b>
																				</React.Fragment>
																			);
																		} else if (
																			(block.summary.includes("Lunch") || block.summary.includes("I-block") || block.summary.includes("Advisory")) &&
																			!friendSchedules[friend[1]].find((item) => activeBlocks.find((activeBlock) => activeBlock.summary === item.block))
																		) {
																			return (
																				<React.Fragment key={block.summary}>
																					{currently}
																					<b key={block.summary}>{block.summary}</b>
																				</React.Fragment>
																			);
																		}
																	}
																	return null;
																})}
															</span>
														)}
													</span>
												</div>
												<span>
													<div className={`${"material-symbols-rounded"}`}>&#xe8f4;</div>
													<div className={`${"material-symbols-rounded"}`} onClick={(e) => openMenu(e, friend)}>
														&#xe5d4;
													</div>
												</span>
											</button>
											{showMenu === friend[1] && (
												<div>
													{isMobile && (
														<div
															className={`${styles.overlay} ${menuFade && styles.fade}`}
															onTouchMove={(e) => {
																e.stopPropagation();
																closeMenu();
															}}
														/>
													)}
													<div
														ref={menuRef}
														className={`${styles.menu} ${menuFade && styles.fade} ${isMobile ? styles.mobileMenu : ""}`}
														style={{ top: menuPosition.top, left: menuPosition.left }}
													>
														<button onClick={() => pin(friend)}>
															<span>{friend[2] === 3 ? "Unpin" : "Pin"}</span>
															{friend[2] === 3 ? (
																<span className={`${"material-symbols-rounded"}`}>&#xe6f9;</span>
															) : (
																<span className={`${"material-symbols-rounded"}`}>&#xe6aa;</span>
															)}
														</button>
														<button onClick={openModal}>
															<span>Remove</span>
															<span className={`${"material-symbols-rounded"}`}>&#xe872;</span>
														</button>
													</div>
												</div>
											)}
										</React.Fragment>
									);
								})
						) : (
							<div className={styles.noFriends}>
								<h3>Scheduling is better with friends!</h3>
								<p>
									Invite your friends to sign up at <span>choobs.app</span> and send them a friend request using the button in the top right.
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
			{showAddModal && (
				<div className={`${styles.modalContainer} ${addModalFade && styles.fade} ${isMobile && styles.mobileModal}`} onClick={closeModal}>
					<div className={`${styles.modalContent} ${addModalFade ? styles.slide : ""}`} onClick={(e) => e.stopPropagation()}>
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
										onChange={(e) => setSearchedUser(e.target.value)}
									/>
									<button type="submit">
										<span className={`${"material-symbols-rounded"}`}>&#xe8b6;</span>
									</button>
								</form>
							</div>
						</div>
						{activeSearch && (
							<div className={styles.pendingFriends}>
								{searchResults.length > 0 ? (
									searchResults.map((user) => {
										return (
											<div key={user[1]} className={styles.searchedFriend}>
												<div>
													<PFP pfp={user[3]} size={2.5} />
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
													<span className={`${"material-symbols-rounded"}`}>&#xe7f0;</span>
													Add
												</button>
											</div>
										);
									})
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
										return friendData.find((friend) => friend[1] === a[1])[0].localeCompare(friendData.find((friend) => friend[1] === b[1])[0]);
									})
									.filter((friend) => {
										return friend[2] === 1;
									})
									.map((friend) => {
										return (
											<div className={styles.pendingFriend} key={friend[1]}>
												<div>
													<PFP pfp={friend[3]} size={2.5} />
													<div>{friend[0]}</div>
												</div>
												<div className={styles.buttons}>
													<button onClick={() => dismissRequest(friend[1], true)}>Ignore</button>
													<button onClick={() => acceptRequest(friend[1])}>Accept</button>
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
										return friendData.find((friend) => friend[1] === a[1])[0].localeCompare(friendData.find((friend) => friend[1] === b[1])[0]);
									})
									.filter((friend) => {
										return friend[2] === 2;
									})
									.map((friend) => {
										return (
											<div className={styles.pendingFriend} key={friend[1]}>
												<div>
													<PFP pfp={friend[3]} size={2.5} />
													<div>{friend[0]}</div>
												</div>
												<div className={styles.buttons}>
													<button onClick={() => dismissRequest(friend[1], false)}>Cancel</button>
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
