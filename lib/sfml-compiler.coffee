{CompositeDisposable} = require 'atom'
{BufferedProcess} = require 'atom'
SfmlCompilerView = require './sfml-compiler-view'
{CompositeDisposable} = require 'atom'

module.exports = SfmlCompiler =
  SfmlCompilerView: null
  modalPanel: null
  subscriptions: null
  config:
    regularFiles:
      title: 'Files settings'
      type: 'object'
      properties:
        sameAsMain:
          title: 'Include resources from same directory as main.cpp'
          type: 'boolean'
          default: true
        resourcesDir:
          title: 'Resources directory'
          type: 'string'
          default: "Leave blank if resources have same directory as main.cpp"
        dllsDir:
          title: 'Directory of dlls that should be included'
          type: 'string'
          default: "c:\\dlls\\"
    deleteBat:
      title: 'Delete compile.bat after compilation'
      type: 'boolean'
      default: true
    createLog:
      title: 'Create compiling_error.txt after unsuccesful compilation'
      type: 'boolean'
      default: true
    hideTerminal:
      title: 'Get rid of console'
      description: 'You can see changes if you launch your app manually'
      type: 'boolean'
      default: true
    sfmlLocation:
      title: 'Location of SFML\\include'
      type: 'string'
      default: 'C:\\SFML\\include'
    compilerOptions:
      title: 'Compiler options'
      type: 'string'
      default: ''

  activate: (state) ->
    @SfmlCompilerView = new SfmlCompilerView(state.SfmlCompilerViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @SfmlCompilerView.getElement(), visible: false)

    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace', 'sfml-compiler:toggle': => @toggle()

  deactivate: ->
    @modalPanel.destroy()
    @subscriptions.dispose()
    @SfmlCompilerView.destroy()

  serialize: ->
    SfmlCompilerViewState: @SfmlCompilerView.serialize()

  toggle: ->
    console.log 'Compiling SFML'

    atom.workspace.observeTextEditors (editor) ->
      editor.save();

    fs = require "fs"

    command = "compile.bat"
    path = atom.project.getPaths()[0]
    args = [path]
    doLog = " 2> compiling_error.txt"
    resourceFiles = atom.config.get("sfml-compiler.regularFiles.resourcesDir")
    if atom.config.get("sfml-compiler.regularFiles.sameAsMain") == true
      resourceFiles = path
    dllFiles = atom.config.get("sfml-compiler.regularFiles.dllsDir")
    deleteDatBatM8 = "\nREM DO IT! COME ON! KILL ME NOW! I'M HERE!\ndel "+path+"\\compile.bat"
    if atom.config.get("sfml-compiler.deleteBat") == false
      deleteDatBatM8 = ""
    if atom.config.get("sfml-compiler.createLog") == false
      doLog = ""
    hideCMD = ""
    if atom.config.get("sfml-compiler.hideTerminal") == true
      hideCMD = " -mwindows"

    # Kill me, please
    someStuff = "@RD /S /Q \""+path+"\\build"+"\"\n"+"mkdir "+path+"\\build\n"+"cd "+path+"\n"+"g++ -Wall -g "+atom.config.get("sfml-compiler.compilerOptions")+" -I"+atom.config.get("sfml-compiler.sfmlLocation")+" -c \""+path+"\\main.cpp\""+" -o build\\main.o"+doLog+"\n"+"findstr \"^\" \"compiling_error.txt\" || del \"compiling_error.txt\"\n"+"g++ -LC:\\SFML\\lib -o \"build\\main.exe\" build\\main.o   -lsfml-graphics -lsfml-window -lsfml-system -lsfml-audio -lsfml-network"+hideCMD+"\n"+"xcopy /s "+dllFiles+"*.dll "+path+"\\build\n"+"copy "+resourceFiles+"\\*.png "+path+"\\build"+"\ncopy "+resourceFiles+"\\*.ttf "+path+"\\build"+"\ncopy "+resourceFiles+"\\*.mp3 "+path+"\\build\n"+"cd "+path+"\\build\n"+"main.exe"+deleteDatBatM8

    fs.writeFile atom.project.getPaths()[0]+"\\compile.bat", someStuff

    # Default to where the user opened atom
    options =
      cwd: atom.project.getPaths()[0]+"\\"
      env: process.env

    stdout = (output) -> console.log(output)
    stderr = (output) -> console.error(output)

    exit = (return_code) ->
      if return_code is 0
        console.log("Exited with 0")
      else
        console.log("Exited with " + return_code)

    # Run process
    new BufferedProcess({command, args, options, stdout, stderr, exit})

    setTimeout ->
      fs.exists path+"\\compiling_error.txt", (exists) ->
        log = fs.readFileSync path+'\\compiling_error.txt', 'utf8'
        atom.notifications.addError(log)
    , 1000
