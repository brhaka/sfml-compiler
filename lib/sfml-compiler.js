(function () {
	var BufferedProcess, CompositeDisposable, SfmlCompiler, SfmlCompilerView;

	CompositeDisposable = require('atom').CompositeDisposable;

	BufferedProcess = require('atom').BufferedProcess;

	SfmlCompilerView = require('./sfml-compiler-view');

	CompositeDisposable = require('atom').CompositeDisposable;

	module.exports = SfmlCompiler = {
		SfmlCompilerView: null,
		modalPanel: null,
		subscriptions: null,
		config: {
			regularFiles: {
				title: 'Files settings',
				type: 'object',
				properties: {
					sameAsMain: {
						title: 'Include resources (.png, .jpg, .ttf, .mp3, .ogg) from same directory as main.cpp',
						type: 'boolean',
						"default": true
					},
					copyAll: {
						title: 'Include all folders, subfolders and files from same directory as main.cpp',
						type: 'boolean',
						"default": false
					},
					resourcesDir: {
						title: 'Resources directory',
						type: 'string',
						"default": "Leave blank if resources have same directory as main.cpp"
					},
					dllsDir: {
						title: 'Directory of dlls that should be included',
						type: 'string',
						"default": "C:\\SFML\\bin"
					},
					libstdcDir: {
						title: 'Directory of \"libstdc++-6.dll\"',
						type: 'string',
						"default": "C:\\MinGW\\mingw32\\bin\\libstdc++-6.dll"
					}
				}
			},
			executeExe: {
				title: 'Run after compiling',
				type: 'boolean',
				"default": true
			},
			deleteBat: {
				title: 'Delete compiler.bat after compilation',
				type: 'boolean',
				"default": true
			},
			createLog: {
				title: 'Create compiling_error.txt after unsuccesful compilation',
				type: 'boolean',
				"default": true
			},
			hideTerminal: {
				title: 'Hide console window',
				description: 'You can see changes if you launch your app manually',
				type: 'boolean',
				"default": true
			},
			sfmlLocation: {
				title: 'Location of SFML\\include',
				type: 'string',
				"default": 'C:\\SFML\\include'
			},
			compilerOptions: {
				title: 'Compiler options',
				type: 'string',
				"default": ''
			}
		},
		activate: function (state) {
			this.SfmlCompilerView = new SfmlCompilerView(state.SfmlCompilerViewState);
			this.modalPanel = atom.workspace.addModalPanel({
				item: this.SfmlCompilerView.getElement(),
				visible: false
			});
			this.subscriptions = new CompositeDisposable;
			return this.subscriptions.add(atom.commands.add('atom-workspace', {
				'sfml-compiler:compile': (function (_this) {
					return function () {
						return _this.compile();
					};
				})(this)
			}));
		},
		deactivate: function () {
			this.modalPanel.destroy();
			this.subscriptions.dispose();
			return this.SfmlCompilerView.destroy();
		},
		serialize: function () {
			return {
				SfmlCompilerViewState: this.SfmlCompilerView.serialize()
			};
		},
		compile: function () {
			var args, command, deleteDatBatM8, dllFiles, doLog, editor, exit, file, fs, hideCMD, options, path, pathToCurrentFile, pathToCurrentWorkingDir, resourceFiles, compileCommands, stderr, stdout;
			console.log('Compiling SFML');
			atom.workspace.observeTextEditors(function (editor) {
				return editor.save();
			});
			fs = require("fs");
			editor = atom.workspace.getActivePaneItem();
			file = "";
			if(editor.buffer && editor.buffer.file) { file = editor.buffer.file; }
			pathToCurrentFile = "";
			if(file.path) { pathToCurrentFile = file.path; }
			pathToCurrentWorkingDir = pathToCurrentFile.substr(0, pathToCurrentFile.lastIndexOf("\\"));
			fileName = pathToCurrentFile.split("\\").pop();
			fileNameWithoutExt = fileName.split(".")[0];
			extName = fileName.split(".")[1];

			if(extName != "cpp") {
				return atom.notifications.addError("sfml-compiler can just compile .cpp files.");
			}

			command = "compiler.bat";
			path = atom.project.getPaths()[0];
			args = [pathToCurrentWorkingDir];

			libstdc = atom.config.get("sfml-compiler.regularFiles.libstdcDir");

			resourceFiles = atom.config.get("sfml-compiler.regularFiles.resourcesDir");
			if (atom.config.get("sfml-compiler.regularFiles.sameAsMain") === true) {
				resourceFiles = pathToCurrentWorkingDir;
			}
			dllFiles = atom.config.get("sfml-compiler.regularFiles.dllsDir");
			deleteDatBatM8 = "del \"" + pathToCurrentWorkingDir + "\\compiler.bat\"";
			if (atom.config.get("sfml-compiler.deleteBat") === false) {
				deleteDatBatM8 = "";
			}
			doLog = " 2> compiling_error.txt";
			if (atom.config.get("sfml-compiler.createLog") === false) {
				doLog = "";
			}
			hideCMD = "";
			if (atom.config.get("sfml-compiler.hideTerminal") === true) {
				hideCMD = " -mwindows";
			}
			execute = "";
			if(atom.config.get("sfml-compiler.executeExe") === true) {
				execute = "\nSTART \"sfml-compiler ~ start\" /D \"" + pathToCurrentWorkingDir + "\\build\" \"" + fileNameWithoutExt + ".exe\"\n";
			}

			copyAll = "";
			if(atom.config.get("sfml-compiler.regularFiles.copyAll") === true) {
				copyAll = "\n@RD /S /Q \"C:\\sfml-compiler__temp\"\nmkdir \"C:\\sfml-compiler__temp\"\nxcopy /e \"" + pathToCurrentWorkingDir + "\" \"C:\\sfml-compiler__temp\"\nxcopy /e \"C:\\sfml-compiler__temp\" \"" + pathToCurrentWorkingDir + "\\build\"\n@RD /S /Q \"C:\\sfml-compiler__temp\"\n@RD /S /Q \"" + pathToCurrentWorkingDir + "\\build\\build\"\ndel /f \"" + pathToCurrentWorkingDir + "\\build\\compiler.bat\", \"" + pathToCurrentWorkingDir + "\\build\\" + fileName + "\"\n";
			}

			compileCommands = "@RD /S /Q \"" + pathToCurrentWorkingDir + "\\build\"\n" + "mkdir \"" + pathToCurrentWorkingDir + "\\build\"\n" + "cd \"" + pathToCurrentWorkingDir + "\"\n" + "g++ -Wall -g " + atom.config.get("sfml-compiler.compilerOptions") + " -o \"" + pathToCurrentWorkingDir + "\\build\\" + fileNameWithoutExt + ".exe\" \"" + pathToCurrentFile + "\" -lsfml-graphics -lsfml-audio -lsfml-network -lsfml-window -lsfml-system" + hideCMD + doLog + "\nif exist compiling_error.txt findstr \"^\" compiling_error.txt || del compiling_error.txt\n" + "\nxcopy /s \"" + dllFiles + "\\*.dll\" \"" + pathToCurrentWorkingDir + "\\build\" \n" + "\ncopy \"" + libstdc + "\" \"" + pathToCurrentWorkingDir + "\\build\" \n" + "copy \"" + resourceFiles + "\\*.png\" \"" + pathToCurrentWorkingDir + "\\build\"" + "\ncopy \"" + resourceFiles + "\\*.ttf\" \"" + pathToCurrentWorkingDir + "\\build\"" + "\ncopy \"" + resourceFiles + "\\*.jpg\" \"" + pathToCurrentWorkingDir + "\\build\"" + "\ncopy \"" + resourceFiles + "\\*.ogg\" \"" + pathToCurrentWorkingDir + "\\build\"" + "\ncopy \"" + resourceFiles + "\\*.mp3\" \"" + pathToCurrentWorkingDir + "\\build\"\n" + copyAll + execute + "\n" + deleteDatBatM8;

			fs.writeFile(pathToCurrentWorkingDir + "\\compiler.bat", compileCommands);

			stdout = function (output) {
				return console.log(output);
			};

			stderr = function (output) {
				return console.error(output);
			};

			exit = function (return_code) {
				if (return_code === 0) {
					return console.log("Exited with 0");
				} else {
					return console.log("Exited with " + return_code);
				}
			};

			var child = require("child_process").exec("cmd /c \"" + pathToCurrentWorkingDir + "\\compiler.bat\"");

			child.stdout.pipe(process.stdout);
			child.on('exit', function() {
				return setTimeout(function () {
					if(fs.existsSync(pathToCurrentWorkingDir + "\\compiling_error.txt")) {
						var log;
						log = fs.readFileSync(pathToCurrentWorkingDir + "\\compiling_error.txt", "utf8");
						if (log != null && log != "") {
							return atom.notifications.addError(log);
						}
					}
				}, 1000);
			});
		}
	};

}).call(this);
