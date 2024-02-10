import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import {
	signInWithEmailAndPassword,
	// sendEmailVerification,
	createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import styles from "./Login.module.css";

function Login(props) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isLogin, setIsLogin] = useState(props.isLogin);

	const navigate = useNavigate();

	const handleLogin = async (e) => {
		e.preventDefault();
		try {
			await signInWithEmailAndPassword(auth, email, password);
			navigate("/");
		} catch (error) {
			setErrorMessage(error.message);
		}
	};

	const handleSignup = async (e) => {
		e.preventDefault();
		if (!name || !email || !password || !confirmPassword) {
			setErrorMessage("Please fill in all required fields.");
			return;
		} else {
			if (!/^\d{2}stu\d{3}@lexingtonma\.org$/.test(email)) {
				setErrorMessage("Please use your Lexington email.");
				return;
			}
			if (password !== confirmPassword) {
				setErrorMessage("Passwords do not match.");
				return;
			}
			try {
				const userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password
				);
				const uid = userCredential.user.uid;
				const userCollectionRef = doc(db, "users", uid);
				const pfp = [["#ff3c3c", "#f68729", "#41e241", "#6be56b", "#40e0d0", "#9c3900", "#ff9494", "#407f40", "#4764ae", "#54808c"][Math.floor(Math.random() * 10)], '🙂'];
				console.log("pfp", pfp);
				setDoc(userCollectionRef, {
					classes: {},
					email: email,
					name: name,
					friends: {},
					pfp: pfp,
				});
				setErrorMessage(
					"Please check your email to verify your account."
				);
				navigate("/");
			} catch (error) {
				console.error(error);
				setErrorMessage(error.message);
			}
		}
	};

	const toggleLoginSignup = () => {
		if (isLogin) {
			navigate("/register");
		} else {
			navigate("/login");
		}
		setIsLogin(!isLogin);
	};

	useEffect(() => {
		if (errorMessage) {
			if (errorMessage.includes("auth/invalid-email")) {
				setErrorMessage("Email invalid. Please try again.");
			}
			if (errorMessage.includes("auth/missing-password")) {
				setErrorMessage("Missing password.");
			}
			if (errorMessage.includes("auth/wrong-password")) {
				setErrorMessage("Password incorrect. Please try again.");
			}
			if (errorMessage.includes("auth/email-already-in-use")) {
				setErrorMessage("Email already in use.");
			}
			if (errorMessage.includes("auth/too-many-requests")) {
				setErrorMessage("Too many attempts. Please try again later.");
			}
			if (errorMessage.includes("auth/weak-password")) {
				setErrorMessage(
					"Your password must be at least 6 characters long."
				);
			}
			const timer = setTimeout(() => {
				setErrorMessage("");
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [errorMessage]);

	const handleEmailAutofill = (e) => {
		if (
			e.target.value.match(/(\d{2})stu(\d{3})/) &&
			!e.target.value.includes("@")
		) {
			setEmail(e.target.value + "@lexingtonma.org");
		} else {
			setEmail(e.target.value);
		}
	};

	return (
		<>
			<div className={styles.loginPage}>
				<div className={styles.page}>
					<Link to="/" className={styles.back}>
						<span className={`${"material-symbols-rounded"}`}>
							&#xe5cb;
						</span>
						<p>Back</p>
					</Link>
					{isLogin ? (
						<>
							<form>
								<div className={styles.loginContainer}>
									<h2>Welcome back!</h2>
									<input
										type="email"
										placeholder="Email"
										value={email}
										className={styles.input}
										onChange={handleEmailAutofill}
									/>
									<input
										type="password"
										placeholder="Password"
										value={password}
										className={styles.input}
										onChange={(e) =>
											setPassword(e.target.value)
										}
									/>
									<button
										className={styles.button}
										onClick={handleLogin}
									>
										Log In
									</button>
								</div>

								<div className={styles.toggleLoginSignup}>
									<p>Need an account?</p>
									<button
										className={styles.link}
										onClick={toggleLoginSignup}
										type="button"
									>
										Register
									</button>
								</div>
							</form>
							{errorMessage && (
								<div
									className={`${styles.errorPopup} ${styles.errorAppear}`}
								>
									<div className={styles.errorMessage}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											height="24"
											viewBox="0 -960 960 960"
											width="24"
										>
											<path d="M479.579-257Q505-257 519.5-270.579t14.5-39Q534-335 519.921-350t-39.5-15Q455-365 440.5-350.193T426-309.965q0 25.421 14.079 39.193Q454.158-257 479.579-257Zm3.281-175q20.14 0 32.64-12.625T528-478v-178q0-19.775-12.675-32.388Q502.649-701 483.009-701q-19.641 0-32.825 12.612Q437-675.775 437-656v178q0 20.75 13.56 33.375Q464.119-432 482.86-432Zm-2.915 373q-87.053 0-164.146-32.604-77.094-32.603-134.343-89.852-57.249-57.249-89.852-134.41Q59-393.028 59-480.362q0-87.228 32.662-163.934 32.663-76.706 90.203-134.253 57.54-57.547 134.252-90.499Q392.829-902 479.836-902q87.369 0 164.544 32.858 77.175 32.858 134.401 90.257 57.225 57.399 90.222 134.514Q902-567.257 902-479.724q0 87.468-32.952 163.882t-90.499 133.781q-57.547 57.367-134.421 90.214Q567.255-59 479.945-59Zm.326-91q136.242 0 232.985-96.387Q810-342.773 810-480.271q0-136.242-96.327-232.985Q617.346-810 479.729-810q-136.242 0-232.985 96.327Q150-617.346 150-479.729q0 136.242 96.387 232.985Q342.773-150 480.271-150ZM480-480Z" />
										</svg>
										{errorMessage}
									</div>
									<div className={styles.errorTimer}></div>
								</div>
							)}
						</>
					) : (
						<>
							<form>
								<div className={styles.loginContainer}>
									<h2>Create an account</h2>
									<input
										type="text"
										placeholder="Full Name"
										value={name}
										className={styles.input}
										onChange={(e) =>
											setName(e.target.value)
										}
									/>
									<input
										type="email"
										placeholder="Email"
										value={email}
										className={styles.input}
										onChange={handleEmailAutofill}
									/>
									<input
										type="password"
										placeholder="Password"
										value={password}
										autoComplete="new-password"
										className={styles.input}
										onChange={(e) =>
											setPassword(e.target.value)
										}
									/>
									<input
										type="password"
										placeholder="Confirm Password"
										value={confirmPassword}
										autoComplete="off"
										className={styles.input}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
									/>
									<button
										className={styles.button}
										onClick={handleSignup}
									>
										Sign Up
									</button>
								</div>
								<div className={styles.toggleLoginSignup}>
									<p>Already have an account? </p>
									<button
										className={styles.link}
										onClick={toggleLoginSignup}
										type="button"
									>
										Log In
									</button>
								</div>
							</form>
							{errorMessage && (
								<div
									className={`${styles.errorPopup} ${styles.errorAppear}`}
								>
									<div className={styles.errorMessage}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											height="24"
											viewBox="0 -960 960 960"
											width="24"
										>
											<path d="M479.579-257Q505-257 519.5-270.579t14.5-39Q534-335 519.921-350t-39.5-15Q455-365 440.5-350.193T426-309.965q0 25.421 14.079 39.193Q454.158-257 479.579-257Zm3.281-175q20.14 0 32.64-12.625T528-478v-178q0-19.775-12.675-32.388Q502.649-701 483.009-701q-19.641 0-32.825 12.612Q437-675.775 437-656v178q0 20.75 13.56 33.375Q464.119-432 482.86-432Zm-2.915 373q-87.053 0-164.146-32.604-77.094-32.603-134.343-89.852-57.249-57.249-89.852-134.41Q59-393.028 59-480.362q0-87.228 32.662-163.934 32.663-76.706 90.203-134.253 57.54-57.547 134.252-90.499Q392.829-902 479.836-902q87.369 0 164.544 32.858 77.175 32.858 134.401 90.257 57.225 57.399 90.222 134.514Q902-567.257 902-479.724q0 87.468-32.952 163.882t-90.499 133.781q-57.547 57.367-134.421 90.214Q567.255-59 479.945-59Zm.326-91q136.242 0 232.985-96.387Q810-342.773 810-480.271q0-136.242-96.327-232.985Q617.346-810 479.729-810q-136.242 0-232.985 96.327Q150-617.346 150-479.729q0 136.242 96.387 232.985Q342.773-150 480.271-150ZM480-480Z" />
										</svg>
										{errorMessage}
									</div>
									<div className={styles.errorTimer}></div>
								</div>
							)}
						</>
					)}
				</div>
				<div className={styles.wave}>
					<svg
						id="visual"
						viewBox="0 0 2000 400"
						width="2000"
						height="400"
						xmlns="http://www.w3.org/2000/svg"
						version="1.1"
					>
						<path
							d="M0 123L55.5 131.2C111 139.3 222 155.7 333.2 162.8C444.3 170 555.7 168 666.8 158.5C778 149 889 132 1000 135.7C1111 139.3 1222 163.7 1333.2 165C1444.3 166.3 1555.7 144.7 1666.8 132.2C1778 119.7 1889 116.3 1944.5 114.7L2000 113L2000 401L1944.5 401C1889 401 1778 401 1666.8 401C1555.7 401 1444.3 401 1333.2 401C1222 401 1111 401 1000 401C889 401 778 401 666.8 401C555.7 401 444.3 401 333.2 401C222 401 111 401 55.5 401L0 401Z"
							fill="#d3dfe2"
						></path>
						<path
							d="M0 189L55.5 199.3C111 209.7 222 230.3 333.2 237.8C444.3 245.3 555.7 239.7 666.8 242C778 244.3 889 254.7 1000 247.5C1111 240.3 1222 215.7 1333.2 211.2C1444.3 206.7 1555.7 222.3 1666.8 226.2C1778 230 1889 222 1944.5 218L2000 214L2000 401L1944.5 401C1889 401 1778 401 1666.8 401C1555.7 401 1444.3 401 1333.2 401C1222 401 1111 401 1000 401C889 401 778 401 666.8 401C555.7 401 444.3 401 333.2 401C222 401 111 401 55.5 401L0 401Z"
							fill="#80a4ae"
						></path>
						<path
							d="M0 340L55.5 332C111 324 222 308 333.2 307.3C444.3 306.7 555.7 321.3 666.8 326.2C778 331 889 326 1000 325.8C1111 325.7 1222 330.3 1333.2 329.5C1444.3 328.7 1555.7 322.3 1666.8 313.7C1778 305 1889 294 1944.5 288.5L2000 283L2000 401L1944.5 401C1889 401 1778 401 1666.8 401C1555.7 401 1444.3 401 1333.2 401C1222 401 1111 401 1000 401C889 401 778 401 666.8 401C555.7 401 444.3 401 333.2 401C222 401 111 401 55.5 401L0 401Z"
							fill="#32383a"
						></path>
					</svg>
				</div>
			</div>
		</>
	);
}

export default Login;
