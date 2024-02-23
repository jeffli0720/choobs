import styles from "./Schedule.module.css";
import React, { useState, useEffect, forwardRef, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { db, auth } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Schedule(props) {
	const [displayDate, setDisplayDate] = useState(() => {
		if (sessionStorage.getItem("displayDate")) {
			return new Date(sessionStorage.getItem("displayDate"));
		} else {
			const date = new Date();
			date.setHours(0, 0, 0, 0);
			sessionStorage.setItem("displayDate", date);
			return date;
		}
	});
	const [events, setEvents] = useState([]);
	const [currentDay, setCurrentDay] = useState(null);
	const [loading, setLoading] = useState(true);
	const [uid, setUID] = useState(null);
	const [scheduleData, setScheduleData] = useState(null);
	const [isMobile, setIsMobile] = useState(isMobileDevice());

	const [swipe, setSwipe] = useState({
		moved: false,
		touchEnd: 0,
		touchStart: 0,
	});
	const { moved, touchEnd, touchStart } = swipe;
	const [swipeOffset, setSwipeOffset] = useState(0);
	const SWIPE_SENSITIVITY = 80; // number of pixels to trigger swipe

	const [blocksRendered, setBlocksRendered] = useState([]);
	const fullDayEvent = useMemo(() => [], []);

	const highlighted = useRef();

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
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

				if (scheduleData) {
					setLoading(false);
				}
			} catch (error) {
				console.error("Error fetching calendar events:", error);
				fetchData();
			}
		};

		fetchData();
	}, [displayDate, scheduleData]);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setUID(user.uid);
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		if (events.length > 0) {
			const fullDayEvents = events.filter((event) => !event.start.dateTime && !event.end.dateTime);
			if (fullDayEvents.length > 0) {
				setCurrentDay(fullDayEvents[0].summary);
			}
		}
	}, [events]);

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(isMobileDevice());
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	function isMobileDevice() {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	useEffect(() => {
		const fetchScheduleData = async () => {
			try {
				if (uid === props.uid && sessionStorage.getItem("scheduleData")) {
					setScheduleData(JSON.parse(sessionStorage.getItem("scheduleData")));
				} else {
					const userRef = doc(db, "users", props.uid);
					const scheduleDataSnapshot = (await getDoc(userRef)).data();

					// Extract the 'classes' data from the snapshot
					const classesData = scheduleDataSnapshot.classes;

					// Map the 'classes' data into the 'scheduleData' array
					const scheduleData = Object.entries(classesData).map(([block, classNames]) => ({
						block,
						classNames,
					}));

					if (uid === props.uid) {
						sessionStorage.setItem("scheduleData", JSON.stringify(scheduleData));
					}

					setScheduleData(scheduleData);
				}
			} catch (error) {
				console.error("Error fetching schedule data:", error);
			}
		};

		if (props.uid && uid) {
			fetchScheduleData();
		}
	}, [props.uid, uid]);

	const handleDateChange = useCallback(
		(increment) => {
			setLoading(true);
			const newDate = new Date(displayDate);
			newDate.setDate(newDate.getDate() + increment);
			sessionStorage.setItem("displayDate", newDate);
			setDisplayDate(newDate);
			setBlocksRendered([]);
			setCurrentDay("");
		},
		[displayDate]
	);

	// Arrow key functionality
	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "ArrowRight") {
				handleDateChange(1);
			}
			if (event.key === "ArrowLeft") {
				handleDateChange(-1);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	});

	/*
	 * Resets displayDate every 4 hours
	 */
	useEffect(() => {
		setBlocksRendered([]);
		if (displayDate.getTime() !== new Date().setHours(0, 0, 0, 0)) {
			const interval = setInterval(() => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				sessionStorage.setItem("displayDate", date);
				setDisplayDate(date);
			}, 4 * 60 * 60 * 1000); // 4 hours in milliseconds

			return () => {
				// Clear the interval when the component unmounts
				clearInterval(interval);
			};
		}
	}, [displayDate, handleDateChange]);

	useEffect(() => {
		const updateHighlightedEvents = () => {
			// Check and update highlighted events based on current time
			const currentTime = new Date();
			const updatedEvents = events.map((event) => {
				const eventStartDate = new Date(event.start.dateTime || event.start.date);
				const eventEndDate = new Date(event.end.dateTime || event.end.date);
				const isHighlighted = currentTime >= eventStartDate && currentTime <= eventEndDate;
				return { ...event, isHighlighted };
			});
			setEvents(updatedEvents);
		};

		const interval = setInterval(() => {
			updateHighlightedEvents();
		}, 1000); // Update every second

		return () => {
			clearInterval(interval);
		};
	}, [events, displayDate]);

	const isHighlightedEvent = (event) => {
		const startTime = new Date(event.start.dateTime);
		const endTime = new Date(event.end.dateTime);
		const currentTime = new Date();

		if (event.summary.includes("Lunch")) {
			return currentTime >= startTime.getTime() && currentTime <= endTime.getTime();
		} else {
			return currentTime >= startTime.getTime() - 5 * 60 * 1000 && currentTime <= endTime.getTime();
		}
	};

	useEffect(() => {
		setTimeout(() => {
			if (highlighted && highlighted.current) {
				highlighted.current.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}, 100);
	}, [displayDate, highlighted, loading]);

	function getShortDayOfWeek(date) {
		const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];
		const currentDate = new Date(displayDate);
		currentDate.setDate(date);
		return daysOfWeek[currentDate.getDay()];
	}

	function getDateWithWrap(date) {
		const currentMonth = displayDate.getMonth();
		const lastDayOfLastMonth = new Date(displayDate.getFullYear(), currentMonth, 0).getDate();
		const lastDayOfThisMonth = new Date(displayDate.getFullYear(), currentMonth + 1, 0).getDate();

		if (date < 1) {
			return lastDayOfLastMonth + date;
		} else if (date > lastDayOfThisMonth) {
			return date - lastDayOfThisMonth;
		} else {
			return date;
		}
	}

	function isWeekend(date) {
		const currentDate = new Date(displayDate);
		currentDate.setDate(date);
		const dayOfWeek = currentDate.getDay();
		return dayOfWeek === 0 || dayOfWeek === 6; // Sunday is 0, Saturday is 6
	}

	const OpenDatePicker = forwardRef(({ onClick }, ref) => (
		<button className={styles.button} onClick={onClick} ref={ref}>
			<span className={`${"material-symbols-rounded"} ${styles.icon}`}>&#xe5cf;</span>
		</button>
	));

	const isWeekday = (date) => {
		const day = date.getDay();
		return day !== 0 && day !== 6;
	};

	const countdown = (event) => {
		const currentTime = new Date();
		const startTime = new Date(event.start.dateTime);
		const endTime = new Date(event.end.dateTime);

		if (startTime > currentTime) {
			// If the start time is in the future
			const timeDifference = startTime - currentTime;
			const minutesUntilStart = Math.floor(timeDifference / 60000);

			return (
				<div className={styles.countdown}>
					<div className={styles.countdownText}>
						<i>{minutesUntilStart + 1 + (minutesUntilStart !== 0 ? " minutes" : " minute") + " until start"}</i>
						<i>0%</i>
					</div>
					<div className={styles.progressBarContainer}>
						<div className={styles.progressBar} style={{ width: "0%" }} />
					</div>
				</div>
			);
		} else {
			const timeDifference = endTime - currentTime;
			const totalTime = endTime - startTime;
			const percentCompleted = parseFloat(Math.min(((totalTime - timeDifference) / totalTime) * 100, 100));

			if (timeDifference >= 60000) {
				// If more than 1 minute left, convert to minutes
				return (
					<div className={styles.countdown}>
						<div className={styles.countdownText}>
							<i>{Math.floor(timeDifference / 60000) + 1 + " minutes remaining"}</i>
							<i>{percentCompleted.toFixed(0) + "%"}</i>
						</div>
						<div className={styles.progressBarContainer}>
							<div
								className={styles.progressBar}
								style={{
									width: `max(${percentCompleted}%, 1rem)`,
								}}
							/>
						</div>
					</div>
				);
			} else {
				// If less than 1 minute left, convert to seconds
				return (
					<div className={styles.countdown}>
						<div className={styles.countdownText}>
							<i>{Math.floor(timeDifference / 1000) + 1 + (Math.floor(timeDifference / 1000) !== 0 ? " seconds" : " second") + " remaining"}</i>
							<i>{percentCompleted.toFixed(0) + "%"}</i>
						</div>
						<div className={styles.progressBarContainer}>
							<div
								className={styles.progressBar}
								style={{
									width: `max(${percentCompleted}%, 1rem)`,
								}}
							/>
						</div>
					</div>
				);
			}
		}
	};

	const handleTouchStart = (e) => {
		let touchStartX = e.targetTouches[0].clientX;
		setSwipe((swipe) => ({ ...swipe, touchStart: touchStartX, moved: false }));
	};

	const handleTouchMove = (e) => {
		let touchEndX = e.targetTouches[0].clientX;
		if (Math.abs(touchStart - touchEndX) > 30) {
			if (touchStart - touchEndX > 0) {
				setSwipeOffset(touchStart - touchEndX - 30);
			} else {
				setSwipeOffset(touchStart - touchEndX + 30);
			}
		}
		setSwipe((swipe) => ({ ...swipe, touchEnd: touchEndX, moved: true }));
	};

	const handleTouchEnd = () => {
		let distanceSwiped = touchStart - touchEnd;
		setSwipeOffset(0);
		if (Math.abs(distanceSwiped) > SWIPE_SENSITIVITY && moved) {
			if (distanceSwiped < 0) {
				handleDateChange(-1);
			} else if (distanceSwiped > 0) {
				handleDateChange(1);
			}
		}
	};

	return (
		<>
			<div className={isMobile ? styles.header : styles.desktopHeader}>
				<button className={styles.button} onClick={() => handleDateChange(-1)}>
					<span className={`${"material-symbols-rounded"}`}>&#xe5cb;</span>
				</button>
				<div className={styles.calendar}>
					<button
						className={`${styles.button} ${displayDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0) ? styles.grayed : ""}`}
						onClick={() => {
							setLoading(true);
							setBlocksRendered([]);
							const date = new Date();
							date.setHours(0, 0, 0, 0);
							sessionStorage.setItem("displayDate", date);
							setDisplayDate(date);
							setCurrentDay("");
						}}
						disabled={displayDate.setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)}
					>
						<span className={`${"material-symbols-rounded"}`}>&#xf053;</span>
					</button>
					<div className={styles.week}>
						<button className={`${styles.button} ${styles.day} ${isWeekend(displayDate.getDate() - 2) ? styles.grayed : ""} `} onClick={() => handleDateChange(-2)}>
							<p>{getShortDayOfWeek(displayDate.getDate() - 2)}</p>
							<p>{getDateWithWrap(displayDate.getDate() - 2)}</p>
						</button>

						<button className={`${styles.button} ${styles.day} ${isWeekend(displayDate.getDate() - 1) ? styles.grayed : ""} `} onClick={() => handleDateChange(-1)}>
							<p>{getShortDayOfWeek(displayDate.getDate() - 1)}</p>
							<p>{getDateWithWrap(displayDate.getDate() - 1)}</p>
						</button>

						<button className={`${styles.button} ${styles.day} ${isWeekend(displayDate.getDate()) ? styles.grayed : ""} ${styles.today}`}>
							<p>{getShortDayOfWeek(displayDate.getDate())}</p>
							<p>{displayDate.getDate()}</p>
						</button>

						<button
							className={`${styles.button} ${styles.day} ${isWeekend(displayDate.getDate() + 1) ? styles.grayed : ""} 
							`}
							onClick={() => handleDateChange(1)}
						>
							<p>{getShortDayOfWeek(displayDate.getDate() + 1)}</p>
							<p>{getDateWithWrap(displayDate.getDate() + 1)}</p>
						</button>

						<button
							className={`${styles.button} ${styles.day} ${isWeekend(displayDate.getDate() + 2) ? styles.grayed : ""}
							`}
							onClick={() => handleDateChange(2)}
						>
							<p>{getShortDayOfWeek(displayDate.getDate() + 2)}</p>
							<p>{getDateWithWrap(displayDate.getDate() + 2)}</p>
						</button>
					</div>
					<DatePicker
						selected={displayDate}
						filterDate={isWeekday}
						onChange={(date) => {
							sessionStorage.setItem("displayDate", date);
							setBlocksRendered([]);
							setDisplayDate(date);
							setCurrentDay("");
						}}
						customInput={<OpenDatePicker />}
					/>
				</div>
				<button className={styles.button} onClick={() => handleDateChange(1)}>
					<span className={`${"material-symbols-rounded"} ${styles.icon}`}>&#xe5cc;</span>
				</button>
			</div>
			<div
				className={isMobile ? styles.schedule : styles.desktopSchedule}
				style={{
					right: swipeOffset > 0 ? `${swipeOffset}px` : `${swipeOffset}px`,
					left: swipeOffset > 0 ? `-${swipeOffset}px` : `${Math.abs(swipeOffset)}px`,
				}}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<div className={styles.date}>
					<h4>
						{displayDate.toLocaleDateString(undefined, {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</h4>
					{loading ? (
						<div className={`${styles.fullDayEvent}`}>
							<h3>Loading...</h3>
						</div>
					) : events.length === 0 ? (
						<div className={`${styles.fullDayEvent}`}>
							<h3>No School</h3>
						</div>
					) : (
						events
							.filter((event) => {
								if (!event.start.dateTime && !event.end.dateTime) {
									fullDayEvent.length = 0;
									fullDayEvent.push(event.summary);
									return true;
								}
								return false;
							})
							.map((event) => {
								return (
									<div key={event.id} className={`${styles.fullDayEvent}`}>
										<h3 key={event.id}>{event.summary}</h3>
									</div>
								);
							})
					)}
				</div>

				<div className={styles.ul}>
					{loading ? (
						<div className="lds-ring">
							<div></div>
							<div></div>
							<div></div>
							<div></div>
						</div>
					) : (
						events
							.filter((event) => {
								if (event.start.dateTime && event.end.dateTime) {
									const hasHalfDay = fullDayEvent.some((element) => element.includes("Half Day"));

									const matchingData = scheduleData.find((data) => data.block.includes(event.summary));
									if (matchingData && !blocksRendered.includes(event.summary) && new Date(event.start.dateTime).getDate() === displayDate.getDate()) {
										blocksRendered.push(event.summary);
									}

									if (!hasHalfDay) {
										if (/^Lunch \d+$/.test(event.summary) && /^Day (\d+)$/.test(currentDay)) {
											if (blocksRendered.some((item) => /^(C|G)\$[1-4]$/.test(item))) {
												return !(/^Lunch \d+$/.test(event.summary) && event.summary !== "Lunch 1");
											} else if (blocksRendered.some((item) => /^(D|H)\$[1-4]$/.test(item))) {
												return !(/^Lunch \d+$/.test(event.summary) && event.summary !== "Lunch 2");
											} else if (blocksRendered !== 0) {
												return !(/^Lunch \d+$/.test(event.summary) && event.summary !== "Lunch 3");
											}
										} else {
											return !/^Lunch \d+$/.test(event.summary);
										}
									} else {
										if (/^Lunch \d+$/.test(event.summary)) {
											const lastBlock = events.find((event) => ["F1", "D2", "C2", "F3", "D4", "C4"].includes(event.summary)).summary;

											try {
												const lastBlockRoom = scheduleData.find((event) => event.block === lastBlock).classNames[1];

												if (lastBlockRoom > 899 || lastBlockRoom < 100 || lastBlockRoom === "") {
													return false;
												}

												if ((event.summary === "Lunch 1" && lastBlockRoom >= 500) || (event.summary === "Lunch 2" && lastBlockRoom < 500)) {
													if (!blocksRendered.includes(event.summary)) {
														blocksRendered.push(event.summary);
													}
													return true;
												}
												return false;
											} catch {
												return false;
											}
										}
										if (!blocksRendered.includes(event.summary.replace("$", ""))) {
											blocksRendered.push(event.summary.replace("$", ""));
										}
										return event.summary.replace("$", "");
									}
								}
								return false;
							})

							.sort((a, b) => {
								const startTimeA = new Date(a.start.dateTime);
								const startTimeB = new Date(b.start.dateTime);

								// If start times are the same, compare by end times
								if (startTimeA.getTime() === startTimeB.getTime()) {
									const endTimeA = new Date(a.end.dateTime);
									const endTimeB = new Date(b.end.dateTime);
									return endTimeA - endTimeB;
								}

								// If start times are different, compare by start times
								return startTimeA - startTimeB;
							})

							.map((event) => {
								const isHalfDay = fullDayEvent.some((element) => element.includes("Half Day"));

								const matchingData = scheduleData.find((data) => {
									if (isHalfDay) {
										// Try [letter]$[number] first
										const summaryWithDollar = event.summary.replace(/([A-Z])(\d+)/, "$1$$$2");

										return data.block.includes(summaryWithDollar) || data.block.includes(event.summary);
									} else {
										// Not a half day, just check for event.summary
										return data.block.includes(event.summary);
									}
								});

								if (isHalfDay) {
									const lastBlock = events.find((event) => ["F1", "D2", "C2", "F3", "D4", "C4"].includes(event.summary)).summary;

									if (lastBlock && scheduleData.length > 0) {
										const lastBlockRoom = scheduleData.find((event) => event.block === lastBlock).classNames[1];

										if (!(lastBlockRoom > 899 || lastBlockRoom < 100)) {
											if (lastBlockRoom >= 500) {
												// if 1st lunch start last block at 11:30
												events[events.findIndex((event) => event.summary === lastBlock)].start.dateTime = new Date(displayDate.setHours(11, 30, 0, 0)).toISOString();
											} else if (lastBlockRoom < 500) {
												// if 2nd lunch end last block at 11:25, start lunch at 11:25
												events[events.findIndex((event) => event.summary === lastBlock)].end.dateTime = new Date(displayDate.setHours(11, 25, 0, 0)).toISOString();
												events[events.findIndex((event) => event.summary === "Lunch 2")].start.dateTime = new Date(displayDate.setHours(11, 25, 0, 0)).toISOString();
											}
										}
									}
								}

								return (
									<React.Fragment key={event.id}>
										{
											// Check if there is data
											matchingData ? (
												// Not a lunch block
												<>
													<div
														className={`${styles.li}${isHighlightedEvent(event) ? " " + styles.highlighted : ""}`}
														key={event.id}
														ref={isHighlightedEvent(event) ? highlighted : null}
													>
														<div className={styles.blockContent}>
															<div>
																<h3>{matchingData.classNames[0]}</h3>
																<p>
																	<i>
																		{new Date(event.start.dateTime)
																			.toLocaleString("en-US", {
																				hour: "numeric",
																				minute: "numeric",
																				hour12: true,
																			})
																			.toLowerCase()}{" "}
																		-{" "}
																		{new Date(event.end.dateTime)
																			.toLocaleString("en-US", {
																				hour: "numeric",
																				minute: "numeric",
																				hour12: true,
																			})
																			.toLowerCase()}
																	</i>
																</p>
															</div>
															{/[A-Za-z]\$?[0-9]/g.test(event.summary) && (
																<div className={styles.info}>
																	<h4>{/^\d+$/.test(matchingData.classNames[1]) ? `Room ${matchingData.classNames[1]}` : matchingData.classNames[1]}</h4>
																	<p>
																		<i>{event.summary}</i>
																	</p>
																</div>
															)}
														</div>
														{isHighlightedEvent(event) && countdown(event)}
													</div>
													{currentDay &&
														currentDay.includes("Half Day") &&
														["F1", "D2", "C2", "F3", "D4", "C4"].includes(event.summary) &&
														blocksRendered.every((str) => !str.includes("Lunch")) && (
															<div className={`${styles.lunchError}`}>
																<div className={styles.warning}>
																	<span className={`${"material-symbols-rounded"}`}>&#xe000;</span>
																	<span>Your lunch could not be calculated.</span>
																</div>
															</div>
														)}
												</>
											) : // Data for specified block does not exist
											// no data is found for any other block either

											scheduleData.length > 0 &&
											  /^[CDGH]\$?[1-4]$/.test(event.summary) &&
											  Object.values(scheduleData).some(
													(value) => value.block === event.summary.replace(/([A-Z])(\d+)/, "$1$$$2") || value.block === event.summary.replace("$", "")
											  ) ? null : (
												<>
													<div
														className={`${styles.li}${isHighlightedEvent(event) ? " " + styles.highlighted : ""}`}
														key={event.id}
														ref={isHighlightedEvent(event) ? highlighted : null}
													>
														{/[A-Za-z]\$?[0-9]/g.test(event.summary) && (
															<div className={styles.warning}>
																<span className={`${"material-symbols-rounded"}`}>&#xe000;</span>
																<span>This block is missing data</span>
															</div>
														)}
														<div className={styles.blockContent}>
															<div>
																<h3>{event.summary}</h3>
																<p>
																	<i>
																		{new Date(event.start.dateTime)
																			.toLocaleString("en-US", {
																				hour: "numeric",
																				minute: "numeric",
																				hour12: true,
																			})
																			.toLowerCase()}{" "}
																		-{" "}
																		{new Date(event.end.dateTime)
																			.toLocaleString("en-US", {
																				hour: "numeric",
																				minute: "numeric",
																				hour12: true,
																			})
																			.toLowerCase()}
																	</i>
																</p>
															</div>
															{/[A-Za-z]\$?[0-9]/g.test(event.summary) && (
																<div className={styles.info}>
																	<p>
																		<i>{event.summary}</i>
																	</p>
																</div>
															)}
														</div>
														{isHighlightedEvent(event) && countdown(event)}
													</div>
													{currentDay &&
														currentDay.includes("Half Day") &&
														["F1", "D2", "C2", "F3", "D4", "C4"].includes(event.summary) &&
														blocksRendered.every((str) => !str.includes("Lunch")) && (
															<div className={`${styles.lunchError}`}>
																<div className={styles.warning}>
																	<span className={`${"material-symbols-rounded"}`}>&#xe000;</span>
																	<span>Your lunch could not be calculated.</span>
																</div>
															</div>
														)}
												</>
											)
										}
									</React.Fragment>
								);
							})
					)}
					{fullDayEvent && currentDay && currentDay.includes("Half Day") && !loading && (
						<div className={styles.subtext}>
							<span>
								<b>1st Lunch:</b> Math & Language Buildings
							</span>
							<span>
								<b>2nd Lunch:</b> Main & Science Buildings{" "}
							</span>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

export default Schedule;
