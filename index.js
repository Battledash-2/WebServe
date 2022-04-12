/**
 * MIT License
 * Copyright (c) 2022 Battledash-2
 * 
 * If a copy of the license was not provided, you
 * may get one at https://opensource.org/licenses/MIT
 */

const express = require('express');
const clrs = require('terminalcolors.js');
const vers = require('./package.json').version;
const ansi = { saveCursor: "\u001b7", restoreCursor: "\u001b8", clearLine: "\u001b[2K" };
const path = require('path');
const fs = require('fs');

const app = express();

const middle = (req, res, next)=>{
	let ok = false;
	if (opt.lap !== null && opt.log) {
		for (let l of opt.lap) {
			if (req.url.toLowerCase().endsWith('.'+l.toLowerCase()) || (l === '' && !req.url.toLowerCase().includes('.'))) {
				ok = true;
				break;
			}
		}
	} else ok = true;
	if (opt.bl !== null && opt.log) {
		for (let b of opt.bl) {
			if (req.url.toLowerCase().endsWith('.'+b.toLowerCase()) || (b === '' && !req.url.toLowerCase().includes('.'))) {
				ok = false;
				break;
			}
		}
	}
	let redirected = false;
	for (let f in opt.connections) {
		if (new RegExp("^/?"+f+"$").test(req.url)) {
			res.sendFile(path.resolve(opt.connections[f]));
			redirected = true;
			break;
		}
	}
	if (ok && opt.log) {
		process.stdout.write(ansi.restoreCursor+ansi.clearLine+`${'LAP'.green()}${': '.hex('#f9f9f9')} ${req.url.yellow()} ${opt.showIp ? ('('.hex('#f9f9f9') + (req.ip).toString().red() + ')'.hex('#f9f9f9')) : ''}`);
		fs.exists(path.join(process.cwd(), opt.path, req.url), (exists)=>{
			process.stdout.write(ansi.restoreCursor+ansi.clearLine+`${'LAP'.green()}${': '.hex('#f9f9f9')} ${req.url.yellow()} ${opt.showIp ? ('('.hex('#f9f9f9') + (req.ip).toString().red() + ') '.hex('#f9f9f9')) : ''}${'('.hex('#f9f9f9')}${(exists || redirected) ? 'resolved'.green() : 'unresolved'.red()}${')'.hex('#f9f9f9')}`);
		});
	}
	if (!redirected) next();
}

const _m = (p,n) => {
	let c = n.slice(0, 1);
	if (p === '--'+c || p === '-'+c ||
	    p === '--'+n || p === '-'+n ||
		p === c || p === n) return true;
}

const helpCmd = (n)=>{
	const outHelp = (name, info) => {
		console.log(`${name}:`);
		console.log(`${info.split('\n').map(c=>'      '+c).join('\n')}`);
	}
	if (typeof n === 'undefined') outHelp('help (v'+vers+')', 'port\nnolog\nlap\nbl\nhelp\ndir\nnolog\nconnect\nredirect');
	if (_m(n, 'port')) outHelp('port', 'decides what port the server should use');
	else if (_m(n, 'nolog')) outHelp('nolog', 'hides logs');
	else if (_m(n, 'lap')) outHelp('lap', 'decides which files should show in the last accessed path area (a / seperated list)\nExample: js/html << will only show any files with .js or .html');
	else if (_m(n, 'blacklist')) outHelp('blacklist', 'blacklist for LAP (a / seperated list)\nExample: js/html << will not show any files with .js or .html');
	else if (_m(n, 'help')) outHelp('help', 'seriously?');
	else if (_m(n, 'dir')) outHelp('dir', 'decides which directory the server should use');
	else if (_m(n, 'connect')) outHelp('connect', 'connect a file to a specific path\nExample: ../lib.js ./library.js');
	else if (_m(n, 'redirect')) outHelp('redirect', 'redirect a folder to a specific path\nExample: ../lib ./library\nIMPORTANT: LAP will not register redirects');
	process.exit(0);
}

const opt = { port: 3000, path: './', log: true, lap: null, bl: null, connections: {}, showIp: true };
for (let i = 0; i<process.argv.length-2; i++) {
	let co = process.argv.slice(2)[i];
	i++;
	let n = process.argv.slice(2)[i];

	if (_m(co, 'port')) {
		if (typeof n === 'undefined') throw new Error('Port declarator without a port');
		opt.port = parseInt(n);
	} else if (_m(co, 'nolog')) {
		opt.log = false;
	} else if (_m(co, 'lap')) {
		if (typeof n === 'undefined') throw new Error('LAP declarator without a ext(s)');
		opt.lap = n.split('/');
	} else if (_m(co, 'blacklist')) {
		if (typeof n === 'undefined') throw new Error('Blacklist declarator without a ext(s)');
		opt.bl = n.split('/');
	} else if (_m(co, 'help')) {
		helpCmd(n);
	} else if (_m(co, 'connect')) {
		if (typeof n === 'undefined') throw new Error('Connection declarator without connection path (1)');
		i++;
		let n1 = process.argv.slice(2)[i];
		if (typeof n1 === 'undefined' || n1.startsWith('-')) n1 = ''; // throw new Error('Connection declarator without connection path (2)');
		opt.connections[n1] = n;
	} else if (_m(co, 'redirect')) {
		if (typeof n === 'undefined') throw new Error('Redirect declarator without connection path (1)');
		i++;
		let n1 = process.argv.slice(2)[i];
		if (typeof n1 === 'undefined' || n1.startsWith('-')) n1 = ''; // throw new Error('Redirect declarator without connection path (2)');
		app.use(n1, express.Router(), middle, express.static(path.join(process.cwd(), n)));
	} else if (_m(co, 'showip')) {
		if (typeof n === 'undefined' || (n.toLowerCase() !== 'off' && n.toLowerCase() !== 'on')) opt.showIp = true;
		else {
			if (n.toLowerCase() === 'on') opt.showIp = true;
			if (n.toLowerCase() === 'off') opt.showIp = false;
		}
	} else if (_m(co, 'version')) {
		console.log(`${'Servhost'.green().bold()}, v${vers.yellow().bold()}`);
		process.exit(0);
	}
	
	else if (_m(co, 'dir') || typeof n === 'undefined') {
		if (typeof n === 'undefined') opt.path = co;
		else if (typeof n !== 'undefined') opt.path = n;
		else throw new Error('Path declarator without path');
	}
}

let webIg = [
	// Images & styles
	'css',
	'jpeg',
	'jpg',
	'png',
	'svg',
	'xml',
	'ico',
	'icon',

	// Scripts
	'js',
	'jsx',
	'mjs',
];
let webIgN = [
	// HTML
	'html',
	'htm',
	'aspx',
	'asp'
];

if (opt.bl != undefined && opt.bl.includes('web')) {
	let idx = opt.bl.indexOf('web');
	opt.bl.splice(idx, 1);
	opt.bl.push(...webIg);
}
if (opt.lap != undefined && opt.lap.includes('web')) {
	let idx = opt.bl.indexOf('web');
	opt.bl.splice(idx, 1);
	opt.bl.push(...webIgN);
}

app.use(express.Router(), middle, express.static(path.join(process.cwd(), opt.path)));
app.listen(opt.port, ()=>{
	if (opt.log) {
		console.log(`${'!'.red().bold()} ${'Server up'.hex('#f5f5f5')} ${'!'.red().bold()}`);
		console.log('--------------------'.hex('#333')+'\u001b[0m');
		console.log(`${'Port'.green()}${':'.hex('#f9f9f9')} ${opt.port.toString().red()}`);
		console.log(`${'Path'.green()}${':'.hex('#f9f9f9')} ${opt.path.toString().yellow()}`);
		console.log(`${'URL'.green()}${':'.hex('#f9f9f9')} ${" localhost".yellow()+':'.hex('#f9f9f9')+opt.port.toString().red()}`);
		process.stdout.write(ansi.saveCursor+`${'LAP'.green()}${': '.hex('#f9f9f9')} ${"...".white().bold()}`);
	}
});