import { Link } from "react-router-dom";

function ErrorPage() {
	return (
		<>
			ErrorPage
			<Link to="/">
				<p>Return Home</p>
			</Link>
		</>
	);
}

export default ErrorPage;
