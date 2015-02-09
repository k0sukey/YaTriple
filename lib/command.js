var _ = require('lodash'),
	chalk = require('chalk'),
	fs = require('fs-extra');

// argument parser
function _parse(cmd){
	var args = cmd.split(' ');
	args.shift();
	return args;
}

exports.constant = {
	'.help': chalk.bold.cyan('.help') + '\n' +
		'\tShow this help',
	'.history': chalk.bold.cyan('.history') + '\n' +
		'\tShow input history\n' +
		'\t!num command execute history line',
	'.load': chalk.bold.cyan('.load') + ' ' + chalk.underline('file') + ' ' + chalk.underline('...') + '\n' +
		'\tLoad a JavaScript file(s)',
	'.save': chalk.bold.cyan('.save') + ' ' + chalk.underline('file') + '\n' +
		'\tSave a input history to file',
	'.restart': chalk.bold.cyan('.restart') + '\n' +
		'\tExecute the Ti.App._restart(); method',
	'.exit': chalk.bold.cyan('.exit') + '\n' +
		'\tExit YaTriple'
};

// print initial message
exports.welcome = function(){
	console.info(chalk.bold('Welcome to ' + chalk.underline('YaTriple') + ' version ' + require('../package.json').version) + '\n');
	exports.help();
};

// help command
exports.help = function(){
	_.each(exports.constant, function(description){
		console.info(description);
	});
};

// history command
exports.history = function(ws, cmd, buffer){
	_.each(buffer, function(item, index){
		console.info(index + '  ' + item);
	});
};

// load command
exports.load = function(ws, cmd){
	var args = _parse(cmd);

	if (args.length === 0) {
		console.error(chalk.bold.red('Invalid argument'));
		console.info(chalk.gray(cmd));

		return;
	}

	_.each(args, function(arg){
		if (arg.match(/^https?:\/\//)) {
			console.warn(chalk.bold.yellow('Does not support URL'));
			console.info(chalk.gray(cmd));
		} else if (fs.existsSync(arg)) {
			var js = fs.readFileSync(arg, {
				encoding: 'utf8'
			});
			ws.send(js);
			console.info(chalk.gray('.load ' + arg));
		} else {
			console.error(chalk.bold.red('Invalid argument ' + arg));
			console.info(chalk.gray(cmd));
		}
	});
};

// save command
exports.save = function(ws, cmd, buffer){
	var args = _parse(cmd);

	if (args.length !== 1) {
		console.error(chalk.bold.red('Invalid argument'));
		console.info(chalk.gray(cmd));
	} else {
		var js = fs.writeFileSync(args[0], buffer.join('\n'), {
			encoding: 'utf8'
		});
		console.info(chalk.gray(cmd));
	}
};

// restart command
exports.restart = function(ws){
	ws.send('Ti.App._restart();');
	console.info(chalk.gray('.restart'));
};

// exit command
exports.exit = function(){
	process.exit(0);
};