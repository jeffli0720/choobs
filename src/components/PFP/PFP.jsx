import styles from "./PFP.module.css";

function PFP(props) {
	const customStyles = {
		width: `${props.size}rem`,
		height: `${props.size}rem`,
		lineHeight: `${props.size}rem`,
		fontSize: `${props.size * 0.6}rem`,
        backgroundColor: props.pfp && `${props.pfp[0]}`,
	};

	return (
		<>
			{props.pfp ? (
				<div style={customStyles} className={styles.pfp}>
					{props.pfp[1]}
				</div>
			) : (
				<img src={props.pfp} alt="" />
                // `https://ui-avatars.com/api/?name=${props.friend[0].trim().replace(/\s+/g, "+")}&background=random&size=128`
			)}
		</>
	);
}

export default PFP;
