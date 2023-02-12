const { app, session, clipboard, Menu, globalShortcut, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const fileName = path.join(app.getPath('userData'), 'options.json');

const default_options = {
  version: 1,
  hotkey : 'Command+Shift+K',
  hotkey2: 'Command+,',
  windowBounds : {
    width: 800,
    height: 600
  }
};


let mainWindow;
let options = {...default_options};

function setupMenu() {
  const template = [
    {
      label: 'ChatGPT window',
      submenu: 
      [
        {
          label: 'Toggle Visibility',
          accelerator: options.hotkey2,
          click: () => {
            console.log('Options dialog'); //;!
            configureHotkey();
          }
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { role: 'redo', accelerator: 'CmdOrCtrl+Shift+Z' },
        { type: 'separator' },
        { role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { role: 'pasteAndMatchStyle' },
        { type: 'separator' },
        { role: 'delete', accelerator: 'Backspace' },
        { role: 'selectAll', accelerator: 'CmdOrCtrl+A' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', accelerator: 'CmdOrCtrl+M' },
        { role: 'close', accelerator: 'CmdOrCtrl+W' }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools', accelerator: 'Alt+CmdOrCtrl+I' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupUI()
{
  registerHotkey();
  setupMenu();

  mainWindow.webContents.on('context-menu', (e, props) => {
    const { selectionText } = props;

    if (selectionText) {
      clipboard.writeText(selectionText);
    }
  });
}

function saveOptions() {
  options.windowBounds = mainWindow.getBounds(); 
  fs.writeFileSync(fileName, JSON.stringify(options), 'utf-8');
}

function loadOptions() {
  try {
    options = {...options, ...JSON.parse(fs.readFileSync(fileName, 'utf-8'))};
  } catch (error) {
    console.error(error);
  }
}

function registerHotkey() {
  globalShortcut.unregisterAll();
  globalShortcut.register(options.hotkey, () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function configureHotkey() {
  const result = dialog.showMessageBoxSync({
    type: 'question',
    buttons: ['OK', 'Cancel'],
    title: 'Configure Hotkey',
    message: 'Enter the desired hotkey:',
    defaultId: 0,
    inputField: options.hotkey
  });

  if (result === 0) {
    options.hotkey = dialog.showMessageBoxSync().value;
    registerHotkey();
  }
}

app.on('ready', () => {
  loadOptions();

  mainWindow = new BrowserWindow({
    title: "ChatGPT window",
    width: options.windowBounds.width,
    height: options.windowBounds.height,
    icon: path.join(__dirname, 'icon.png'),
    x: options.windowBounds.x,
    y: options.windowBounds.y,
    webPreferences: {
      nodeIntegration: true,
      session: session.fromPartition('persist:chatgptwin')
    }
  });

  mainWindow.loadURL('https://chat.openai.com');

  // Unregister hotkeys
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('before-quit', () => {
    saveOptions();
  });

  setupUI();
});

