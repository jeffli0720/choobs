import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";

import "./index.css";

import TabBar from "./pages/TabBar/TabBar";
import SideBar from "./pages/SideBar/SideBar";
import Schedule from "./pages/Schedule/Schedule";
import Social from "./pages/Social/Social";
import Settings from "./pages/Settings/Settings";
import LandingPage from "./pages/LandingPage/LandingPage";
import Login from "./pages/Login/Login";
import ErrorPage from "./pages/ErrorPage/ErrorPage";

export default function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isMobile, setIsMobile] = useState(isMobileDevice());

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setUser(user);
			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

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
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);
	}

	if (loading) {
		// Show loading spinner or skeleton screen while checking authentication state
		return (
			<div className="lds-ring">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		);
	}

	return (
		<BrowserRouter>
			<Routes>
				{!user ? (
					<>
						<Route path="*" element={<Navigate to="/" replace />} />
						<Route path="/register" element={<Login isLogin={false} />} />
						<Route path="/login" element={<Login isLogin={true} />} />
					</>
				) : (
					<Route
						path="/"
						element={
							isMobile ? <TabBar  uid={user.uid} /> : <SideBar uid={user.uid} />
						}
					>
						<Route index element={<Schedule uid={user.uid} />} />
						<Route path="social" element={isMobile ? <Social /> : <Navigate to="/" replace />} />
						<Route path="settings" element={<Settings uid={user.uid}/>} />
					</Route>
				)}
				<Route path="/" element={<LandingPage />} />
				<Route path="*" element={<ErrorPage />} />
			</Routes>
		</BrowserRouter>
	);
}
