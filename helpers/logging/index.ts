function report(message) {
	const date = new Date().toLocaleString();

	console.log(`logged on: ${date}`);
	console.log(message);
}
function error(message) {
	console.error(message);
}
function warn(message) {
	console.warn(message);
}

export default { report, error, warn }