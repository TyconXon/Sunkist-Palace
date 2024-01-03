/***
 *      _________             __   .__          __
 *     /   _____/__ __  ____ |  | _|__| _______/  |_
 *     \_____  \|  |  \/    \|  |/ /  |/  ___/\   __\
 *     /        \  |  /   |  \    <|  |\___ \  |  |
 *    /_______  /____/|___|  /__|_ \__/____  > |__|
 *            \/           \/     \/       \/
 */
/***  Max, Aft, Box, Sky, Avn, Vin, Tar, Leo, Rey, New
 *    ___________    .__  .__
 *    \_   _____/___ |  | |  |   ______  _  __ ___________  ______
 *     |    __)/  _ \|  | |  |  /  _ \ \/ \/ // __ \_  __ \/  ___/
 *     |     \(  <_> )  |_|  |_(  <_> )     /\  ___/|  | \/\___ \
 *     \___  / \____/|____/____/\____/ \/\_/  \___  >__|  /____  >
 *         \/ The amazin chat room                \/           \/
 */
/***
 *    ████████╗ ██████╗ ██████╗  ██████╗
 *    ╚══██╔══╝██╔═══██╗██╔══██╗██╔═══██╗██╗
 *       ██║   ██║   ██║██║  ██║██║   ██║╚═╝
 *       ██║   ██║   ██║██║  ██║██║   ██║██╗
 *       ██║   ╚██████╔╝██████╔╝╚██████╔╝╚═╝
 *       ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝
 *
 */
//* Load a picture for every person online
//* CSS editor button and css editor itself
//* IMG borders
//* Room-based DMs system
//* Profile on pfp click
//* Custom personalized text sounds and ping sounds
//* Sticker-like IMG picker  (alt-numbers maybe?)
//* Post/Get functionality
//* Add back subpages
//* Add a settings page
//* Rework the chat messages to only send important information such as the usr and msg  - for preformance
//* yk how like gmod servers will play a sound when u say something specific? do that with like ace attrny and hl1 sci

//
const MEM = true; /** Memory-Mode: Are messages stored in memory or forgotten after relay? */
const splashTexxt = "You can now upload files."; /** MOTD */

//Requires
var http = require("http");
const { Server } = require("socket.io");
var url = require("url");
const request = require("request");
const webhookURL = process.env["webhookURL"];
var fs = require("fs");
const { setTimeout, setInterval } = require("timers");
const busboy = require('busboy');
const path = require('path');
const status = require('./status.json');

const directory = "temp";

fs.readdir(directory, (err, files) => {
	if (err) throw err;

	for (var file of files) {
		fs.unlink(path.join(directory, file), (err) => {
			if (err) throw err;
		});
	}
});

var whoHasConnected = [];

/** Where the messages are stored */
var list = MEM
	? /** It's an array if memory mode is on */
	[`<div id='splash' class='message splash console'> ${splashTexxt}</div>`]
	: /** Otherwise it's a fake array with a fake length. How pathetic. */
	{ length: 0 };

//Server-side data
var talkers = []; /** Array of those who are talking */
var serverData = {}; /** A database for whatever the users may want to store globally */
var connected = 0; /** A more reliable way of seeing how many people are online */
var onliners = new Map(); /** 'Array' of online people with their names tied to their client ID */

/** Removes a message from the list */
function moderate(msgId) {
	try {
		list[msgId] = "<div class='console removed'><ml>r</ml>[Removed]</div>";
	} catch (e) {
		console.log(e);
	}

	io.emit("moderate", msgId);
}

/** SERVER */
const server = http.createServer(function(req, res) {
	var q = url.parse(req.url, true);
	var qData = q.query;

	//
	if (req.url === '/upload') {
			let filename = '';
			const bb = busboy({ headers: req.headers });
			bb.on('file', (name, file, info) => {
				if(info.filename == undefined){
					res.writeHead(201);
					res.end(`<head> <meta http-equiv="refresh" content="0; url=https://server--maximusmiller2.repl.co/"> </head>
					<a href='https://server--maximusmiller2.repl.co/'>You can't upload nothing!</a>`);
					return 2;
				}
				filename = info.filename.replace(/ /g, '_').replace(/"/g, '-').replace(/'/g, '-');;
				const saveTo = path.join(__dirname + '/temp/', filename);
				file.pipe(fs.createWriteStream(saveTo, { highWaterMark: 1024 * 1024 })).on('error', (err) => {
							console.error(`Error writing file: ${err}`);
							res.status(500).end(`Error writing file: ${err}`);
					});;
			});
			bb.on('finish', () => {
				console.log(`upload success: ${filename}`);
				let Celement = isImageFile(filename)?'img':isAudioFile(filename)?'audio':isVideoFile(filename)?'video':'a';
				let other = isImageFile(filename)?false:isAudioFile(filename)?false:isVideoFile(filename)?false:true;
				res.writeHead(201);
				res.end(`<head> <meta http-equiv="refresh" content="0; url=https://server--maximusmiller2.repl.co/?preset=${other?'':'<br>'}<${Celement} ${other?'download':''} class='${other?'':'openInTab'}' controls title='${filename}' href='temp/${filename}' src='temp/${filename}'>${other?filename:''}</${Celement}>"> </head>
				<a href='https://server--maximusmiller2.repl.co/?preset=${filename}'>upload success: ${filename}</a>`);
			});
			req.pipe(bb);
		return 0;
		}


	if(q.path.includes('.') && (qData.slow == undefined) && (qData.preset == undefined) && (qData.message == undefined)) {
		//res.writeHead(200, { "Content-Type": "image/png" });
		try{
			res.write(fs.readFileSync('.'+q.path));
		}catch(e){
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.write(e.toString());
		}
		return res.end();
	} 

	if (qData.message != null && qData.message != undefined) {
		if (qData.user == null) {
			qData.user = "guest";
		}
		sendMessage(qData.user, qData.message);
	}
	if (qData.moderate != undefined) {
		moderate(qData.moderate);
	}

	res.writeHead(200, { "Content-Type": "text/html" });
	fs.readFile("index.html", function(err, data) {
		if (qData.slow == undefined) {
			res.write(data);
		} else {
			res.write(`
			<script>
			function text(){var e=window.prompt("Say:");window.location.assign("https://server--maximusmiller2.repl.co/?slow=a&message="+e+"&user="+window.localStorage.getItem("username"))}document.addEventListener("keyup",e=>{switch(e.key){case"Enter":text();break;case"Shift":window.location.assign("https://server--maximusmiller2.repl.co/?slow=a")}});
			</script>
			<button onclick="text()" href="#aaa" style="position: sticky;">Add to chat.</button>
		<a href="https://server--maximusmiller2.repl.co/?slow=a">Refresh text without responding</a>
		`);
		}
		if (MEM) {
			for (let msg in list) {
				res.write(list[msg]);
			}
		} else {
		}
		res.write("<hr id='lastRead'>");
		//res.write(list.toString().replaceAll(',', ','));

		return res.end();
	});
}).listen(8080);

const io = new Server(server);

function sendMessage(usr, message, phone, sckt, room = null) {
	let curTime = new Date();

	if (message.startsWith("/moderate")) {
		if (usr.endsWith("2") || (usr.startsWith("A") && usr.endsWith("n"))) {
			moderate(message.split(" ")[1]);
			askUpdate();
			return true;
		} else {
			console.log("@" + usr + ": " + message);
			askUpdate();
			io.emit(
				"outMessage",
				`<div class='console message removed'><ml>q</ml> ${usr} Tried to use a command they weren't authorized to use... (Moderation)</div>`
			);
		}
	} else if (message.startsWith('/edit')) {
		var id = message.split(' ')[1];
		var txt = message.split(' ').slice(2).join(' ');

		if(list[id] == undefined){
			askUpdate();
			io.emit(
				"outMessage",
				`<div class='console message removed'><ml>q</ml> ${usr} Tried to edit a message that didn't exist! (${id} - > ${txt})</div>`
			);
			return 1;
		}

		if (list[id].includes(usr) || (usr.endsWith("2") || (usr.startsWith("A") && usr.endsWith("n")))) {
			list[id] = `<div id='${id}' class='message ${usr} ${phone ? "phone" : ""
				}'> <strong class='identifier' onClick='pingGen("${usr}")'> ${usr} @ <abbr noicon title='${curTime.toLocaleString(
					"en-US",
					{ timeZone: "US/Arizona" }
				)}'> ${curTime.toLocaleTimeString("en-US", {
					timeZone: "US/Arizona",
				})}:</ins></strong> <msgtxt>${txt}</msgtxt> <button class='rightist' onClick="maple(${id
				})">${id} (edited)</button> </div>`;
			askEdit(id, list[id]);
			return true;
		} else {
			askUpdate();
			io.emit(
				"outMessage",
				`<div class='console message removed'><ml>q</ml> ${usr} Tried to edit a message that wasn't theirs... (Edit)</div>`
			);
		}
	} else if (message.startsWith("/join")) {
		var rm = message.split(' ')[1];
		try{
		if ((rm == 'afxon') && (usr != 'Afton' && usr != 'MaximusMiller2')) {
			io.emit(
				"outMessage",
				`<div class='console message removed'><ml>q</ml> ${usr} Tried to join a private room... (Join)</div>`
			);
			return false;
		}

		sckt.join(rm);
		io.to(rm).emit(
			"outMessage",
			`<div class='console message room ${rm}'><bx>C</bx> ${usr} Joined ${rm}.</div>`
		);
		}catch (e){
			io.emit(
				"outMessage",
				`<div class='console message removed'>ERROR: FROM: ${usr}, MESSAGE: ${message}, OUT: ${e}</div>`
			);
		}

		return true;
	} else if (message.startsWith("/to")) {
		try{
		var rm = message.split(' ')[1];
		var txt = message.split(' ').slice(2).join(' ');
		sendMessage(usr, txt, phone, sckt, rm);
		}catch (e){
			io.emit(
				"outMessage",
				`<div class='console message removed'>ERROR: FROM: ${usr}, MESSAGE: ${message}, OUT: ${e}</div>`
			);
		}
		return true;
	} else if (message.startsWith('/restart') && (usr == 'MaximusMiller2')) {
		io.emit("outMessage", `<div class='console message'> <bx>k</bx><${usr}> ${usr} </${usr}><bx>k</bx> Requested restart (reason: ${message.split(' ').slice(1).join(' ')})</div>`);
		io.emit("outMessage", "<hr restart>");
		console.log(`Shutting down... ( ${message.split(' ').slice(1).join(' ')} )`);
		process.exit(0);

		return false;
	} else if (message.startsWith('/list')) {
		
		console.log(io.of("/").adapter.rooms);
		
		var availableRooms = [];
		var rooms = io.of("/").adapter.rooms;
		if (rooms) {
				for (var croom in rooms) {
						if (!rooms[croom].hasOwnProperty(croom)) {
								availableRooms.push(croom);
						}
				}
		}
		
		console.log(availableRooms);
		io.emit('outMessage', `<div class='console message'><pre> ${JSON.stringify([...io.of("/").adapter.rooms])}</pre></div>`);
		
	} else if (message.startsWith('/whc')) {
		io.emit('outMessage', `<div class='console message'><pre>${JSON.stringify(whoHasConnected)}</pre></div>`);
	} else if (message.startsWith('/leave')) {
		var rm = message.split(' ')[1];
		io.to(rm).emit(
			"outMessage",
			`<div class='console message room ${rm}'><bx>q</bx> ${usr} left ${rm}.</div>`);
		sckt.leave(rm);

		return true;

	} else if (message.startsWith('/check')) {
		var user = message.split(' ')[1];
		try{
		fs.readFile('status.json', 'utf8', function(err, data) {
			if(err){
				io.emit('outMessage', `<div class='console message'>ERROR: <pre>${err}</pre></div>`);
				console.log(err);

				return;
			}
			io.emit('outMessage', `<div class='console message'><pre>${JSON.parse(data)[user]}</pre></div>`);
		});
		}catch(err){
			console.log(err);
			io.emit('outMessage', `<div class='console message'>ERROR: <pre>${err}</pre></div>`);
		}
	}else if (message.startsWith('/status')) {
		var MonosodiumGutamate = message.split(' ').slice(1).join(' ');
		try{
			
			let name = 'status.json';
			status[usr] = MonosodiumGutamate;
			fs.writeFile(name, JSON.stringify(status), function writeJSON(err) {
				if (err) return console.log(err);
				console.log(JSON.stringify(status));
				console.log('writing to ' + name);
			});
			
		}catch(err){
			console.log(err);
			io.emit('outMessage', `<div class='console message'>ERROR: <pre>${err}</pre></div>`);
		}
	}

	let extendedMessage;
	if (!usr.startsWith("nxm")) {
		if (
			message != ":3" &&
			message != "3" &&
			message != "=3" &&
			message != "&:" &&
			message != "&="
		) {

			let collapsed = false;

			if(list[list.length-1] != undefined){
				if(list[list.length-1].includes(`<div id='${list.length-1}' class='message ${usr}`)){
					collapsed = true;
				}
			}
			
			extendedMessage = `<div id='${list.length}' class='message ${usr} ${collapsed?'collapsed':''} ${phone ? "phone" : ""
				} ${room != null ? 'room' : ''} ${room != null ? room : ''}'> <strong class='identifier' onClick='pingGen("${usr}")'> ${usr} ${room != null ? '#<room>' + room + '</room> ' : ''} @ <abbr noicon title='${curTime.toLocaleString(
					"en-US",
					{ timeZone: "US/Arizona" }
				)}'> ${curTime.toLocaleTimeString("en-US", {
					timeZone: "US/Arizona",
				})}:</ins></strong> <msgtxt>${message}</msgtxt> <button class='rightist' onClick="maple(${list.length
				})">${list.length}</button> </div>`;
			
		} else {
			let variationOfACloud = ":3";
			extendedMessage = `<div id='${list.length}' class='message ${usr} ${phone ? "phone" : ""
				}'> <strong class='identifier' onClick='pingGen("${usr}")'> ${usr} <abbr noicon title='${curTime.toLocaleString(
					"en-US",
					{ timeZone: "US/Arizona" }
				)}'> </ins></strong> <msgtxt>${variationOfACloud}</msgtxt> </abbr> <button class='rightist' onClick="maple(${list.length
				})">${list.length}</button> </div>`;
		}
	} else {
		extendedMessage = message;
	}

	if (MEM && room == null) {
		list.push(extendedMessage);
	} else {
		list.length++;
	}

	if (message.search("novis") == -1 || room != null) {
		console.log("@" + usr + ": " + message);
		
		request({
			method: "POST",
			url: webhookURL,
			formData: {
				content: `${message} ${phone ? "✆" : ""}`,
				username: `${usr}`,
			},
		});
		
	}

	askUpdate();
	if (room != null) {
		io.to(room).emit("outMessage", extendedMessage);
	} else {
		io.emit("outMessage", extendedMessage);
	}

}

function askUpdate() {
	io.emit("requestUpdate");
}
function askEdit(id, msg) {
	io.emit('requestEdit', id, msg);
}
function askPingUpdate(usr) {
	io.emit("requestPingUpdate", usr);
}

io.of("/").adapter.on("join-room", (room, id) => {
	onliners.forEach((value, key) => {
		if (value == id) {
			console.log("+" + key + ` JOINED: ` + room);
		}
	});
});
io.of("/").adapter.on("leave-room", (room, id) => {
	onliners.forEach((value, key) => {
		if (value == id) {
			console.log("-" + key + ` LEFT: ` + room);
			io.to(room).emit(
				"outMessage",
				`<div class='console message room ${room}'><bx>q</bx> ${key} left ${room}.</div>`
			);
		}
	});


});

io.on("connection", (socket) => {
	//Messages
	socket.on("inMessage", (usr, message, phone) => {
		//console.log("@AUTO: " + usr + ":" + message)
		sendMessage(usr, message, phone, socket);
	});

	//Online people
	connected++;
	console.log("T");

	socket.on("indentify", (usrname) => {
		onliners.set(usrname, socket.id);
		if (!whoHasConnected.includes(usrname)) {
			whoHasConnected.push(usrname);
		}

		console.log("|" + usrname + `[${connected}]`);
		socket.join(usrname);
		if (usrname == 'MaximusMiller2' || usrname == 'Afton') {
			socket.join('admin');
		}
	});

	//Offline people
	socket.on("disconnect", () => {
		connected--;
		onliners.forEach((value, key) => {
			if (value == socket.id) {
				console.log("⊥" + key + `[${connected}]`);
				onliners.delete(key);
			}
		});
		io.emit('reqID');
	});

	socket.on("setData", (index, value) => {
		serverData[index] = value;
		console.log("Data " + index + " Is now " + value);
	});

	socket.on("getData", (index, callback) => {
		callback(serverData[index]);
		//socket.emit('getDataFinished', index, serverData[index])
		console.log("Got " + index + ": " + serverData[index]);
	});

	socket.on("changeData", (index, change) => {
		console.log(
			`data[${index}]: ${serverData[index]} -> ${serverData[index] + change}`
		);
		serverData[index] += change;
	});

	//Typing people
	socket.on("typing", (usr) => {
		if (talkers.includes(usr)) {
			return;
		}
		let usrTyper = talkers.push(usr);
		console.log(talkers);

		setTimeout(() => {
			console.log("-" + usr);
			talkers.splice(
				talkers.findIndex((value) => {
					return value == usr;
				})
			);
		}, 2 * 1000);
	});
});

//Heartbeat
setInterval(() => {
	io.emit("getTalkers", talkers);
	io.emit("getConnected", connected);
	io.emit("getOnliners", Object.fromEntries(onliners));
}, 250);

//Graceful shutdown
function gracefulRestart(signal) {
	io.emit("outMessage", "<hr restart>");
	
	console.log("Shutting down...");
	process.exit(0);
}
process.on("SIGTERM", gracefulRestart);
process.on("SIGINT", gracefulRestart);

	function isImageFile(filename) {
		const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
		const fileExtension = filename.split('.').pop().toLowerCase();
		return imageExtensions.includes(fileExtension);
	}

	// Function to check if a filename represents an audio file
	function isAudioFile(filename) {
		const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma']; 
		const fileExtension = filename.split('.').pop().toLowerCase();
		return audioExtensions.includes(fileExtension);
	}

	// Function to check if a filename represents a video file
	function isVideoFile(filename) {
		const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'webm']; 
		const fileExtension = filename.split('.').pop().toLowerCase();
		return videoExtensions.includes(fileExtension);
	}