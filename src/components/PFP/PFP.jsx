import styles from "./PFP.module.css";

function PFP(props) {
	const customStyles = {
		width: `${props.size}rem`,
		minWidth: `${props.size}rem`,
		height: `${props.size}rem`,
		lineHeight: `${props.size}rem`,
		fontSize: `${props.size * 0.6}rem`,
		backgroundColor: `${props.pfp[0]}`,
	};

	return (
		<>
			{props.pfp && (
				<div style={customStyles} className={styles.pfp}>
					{props.pfp[1]}
				</div>
			)}
		</>
	);
}

export default PFP;
