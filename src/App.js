import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";

import "./index.css";

import SideBar from "./components/SideBar/SideBar";
import TabBar from "./components/TabBar/TabBar";

import ErrorPage from "./pages/ErrorPage/ErrorPage";
import InstallPage from "./pages/InstallPage/InstallPage";
import LandingPage from "./pages/LandingPage/LandingPage";
import Login from "./pages/Login/Login";
import Schedule from "./pages/Schedule/Schedule";
import Settings from "./pages/Settings/Settings";
import Social from "./pages/Social/Social";

export default function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isMobile, setIsMobile] = useState(isMobileDevice());

	const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone || document.referrer.includes("android-app://");

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user) => {
			if (!user) {
				window.sessionStorage.clear();
			}
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
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
		<>
			{/* {!isMobile || (isMobile && isPWA) ? ( */}
			<BrowserRouter>
				<Routes>
					{!user ? (
						<>
							<Route path="*" element={<Navigate to="/" replace />} />
							<Route path="/register" element={<Login isLogin={false} />} />
							<Route path="/login" element={<Login isLogin={true} />} />
							{isMobile && <Route path="/download" element={<InstallPage />} />}
						</>
					) : (
						<Route path="/" element={isMobile ? <TabBar uid={user.uid} /> : <SideBar uid={user.uid} />}>
							<Route index element={<Schedule uid={user.uid} />} />
							<Route path="/social" element={isMobile ? <Social /> : <Navigate to="/" replace />} />
							<Route path="/settings" element={<Settings uid={user.uid} />} />
						</Route>
					)}
					<Route path="/" element={<LandingPage isPWA={isPWA} />} />
					<Route path="*" element={<ErrorPage />} />
				</Routes>
			</BrowserRouter>
			{/* ) : (
				<InstallPage setIsPWA={setIsPWA} />
			)} */}
		</>
	);
}
