const fs = require('fs');
const txt = fs.readFileSync('client/src/pages/UserDashboard.tsx','utf8');
let balance = 0;
const lines = txt.split(/\r?\n/);
lines.forEach((line, idx) => {
	const openCount = (line.match(/<div\b/g) || []).length;
	const closeCount = (line.match(/<\/div>/g) || []).length;
	balance += openCount - closeCount;
	if (openCount || closeCount) {
		console.log(`${idx + 1}: balance=${balance} (open:${openCount} close:${closeCount})`);
	}
});
console.log('final balance', balance);
