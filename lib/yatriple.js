var _ = require('lodash'),
	chalk = require('chalk'),
	exec = require('child_process').exec,
	fs = require('fs-extra'),
	readline = require('readline'),
	path = require('path'),
	program = require('commander'),
	Q = require('q'),
	spawn = require('child_process').spawn,
	spinner = require('char-spinner'),
	tiappXml = require('tiapp.xml'),
	WebSocketServer = require('ws').Server;

var TI_BUILD_TIMEOUT = 30000;

program.version(require('../package.json').version)
	.usage('[options]')
	.option('-a, --app <path>', 'specify a different app.js. default is realy empty')	
	.option('-m, --module <id|zip>', 'specify a module(s)')
	.option('-s, --sdk <version>', 'specify a Titanium SDK version. default is Titanium CLI selected version')
	.option('-P, --port <port>', 'using TiWSEvaluateJS port. default 8888')
	.option('-C, --clean', 'cleaning contained app/build folder')
	.option('-v, --verbose', 'enable verbose output');

program.parse(process.argv);

var app = path.join(__dirname, '..', 'app'),
	res = path.join(app, 'Resources'),
	interval;

!program.verbose && (interval = spinner());

Q.when().then(function(){
	// titanium sdk check
	var d = Q.defer();

	exec('titanium sdk list --output json', {
		stdio: 'inherit'
	}, function(error, stdout, stderr){
		if (error) {
			d.reject();
		} else {
			d.resolve(JSON.parse(stdout));
		}
	});

	return d.promise; 
}).then(function(sdk){
	// set the tiapp.xml for TiWSEvaluateJS
	var d = Q.defer();

	(function(){
		var tiapp = tiappXml.load(path.join(app, 'tiapp.xml')),
			modules = tiapp.getModules();

		_.each(modules, function(module){
			if (module.id !== 'be.k0suke.tiwsevaluatejs') {
				tiapp.removeModule(module.id, 'iphone');
				fs.removeSync(path.join(app, 'modules', 'iphone', module.id));
			}
		});

		if (program.module) {
			modules = program.module.split(',');

			_.each(modules, function(module){
				if (module.match(/\.zip$/)) {
					fs.copySync(module, path.join(app, path.basename(module)));
					var mod = path.basename(module).split('-'),
						version = mod.pop(),
						platform = mod.pop();
					tiapp.setModule(mod.join('-'), version.replace(/\.zip$/, ''), platform);
				} else {
					tiapp.setModule(module);
				}
			});
		}

		if (_.has(sdk.installed, program.sdk)) {
			tiapp.sdkVersion = program.sdk;
		} else {
			tiapp.sdkVersion = sdk.activeSDK;
		}

		tiapp.setProperty('evaluate-host', 'ws://localhost:' + (program.port || 8888), 'string');
		tiapp.write();

		d.resolve();
	})();

	return d.promise;
}).then(function(){
	// cleaning app/app.js and app/build folder, coping specify a different app.js
	var d = Q.defer();

	fs.outputFile(path.join(res, 'app.js'), '', function(err){
		if (err) {
			d.reject();
		} else {
			program.clean && fs.removeSync(path.join(app, 'build'));

			if (!program.app) {
				d.resolve();
			} else if (!fs.existsSync(program.app)) {
				d.reject();
			} else {
				fs.copySync(program.app, path.join(res, 'app.js'));
				d.resolve();
			}
		}
	});

	return d.promise;
}).then(function(){
	// lauch the WebSocket server and YaTriple app
	var d = Q.defer();

	var wss = new WebSocketServer({
		port: program.port || 8888
	});

	wss.on('connection', function(ws){
		clearTimeout(timeout);

		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.on('line', function(cmd){
			console.info(chalk.gray(cmd));
			ws.send(cmd);
			rl.prompt();
		}).on('close', function(){
			process.stdout.write('\n');
			process.exit(0);
		});
		rl.prompt();

		d.resolve();
	});

	var build = spawn('titanium', [
		'build',
		'--platform',
		'ios',
		'--retina',
		'--tall',
		'--project-dir',
		app
	]);

	if (program.verbose) {
		build.stdout.on('data', function(data){
			process.stdout.write(data.toString());
		});
		build.stderr.on('data', function(data){
			process.stderr.write(data.toString());
		});
	}

	var timeout = setTimeout(function(){
		d.reject('Titanium CLI build command timeouted');
	}, TI_BUILD_TIMEOUT);

	return d.promise;
}).fail(function(err){
	err && console.error(err);
	process.exit(0);
}).done(function(){
	!program.verbose && clearInterval(interval);
});