/**
 * Yourprojectname
 * =====================
 * yourprojectdesc
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 * @link:    Homepage: https://yourprojectname.com
 *           Docs:     https://docs.yourprojectname.com/README.md
 *           NPM:      https://npmjs.com/package/@ptkdevio/yourprojectname
 *           GitHub:   https://github.com/ptkdev/yourprojectname
 *
 */
const config = require("./configs/config");
const translate = require(`./translations/${config.system.language}`);
const {app, BrowserWindow, Tray, Menu} = require("electron");
const path = require("path");
let main_window;
let app_icon, context_menu;

require("electron-context-menu")({
	prepend: (params) => [{
		labels: {
			cut: translate.electron_cut,
			copy: translate.electron_copy,
			paste: translate.electron_paste,
		},
		visible: params.mediaType === "input"
	}]
});

function create_window() {
	main_window = new BrowserWindow({
		width: 1024,
		height: 768,
		title: "Yourprojectname",
		icon: path.join(__dirname, "/themes_en/default/img/icons/electron/icon.png"),
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: true
		}
	});

	app_icon = new Tray(path.join(__dirname, "/themes_en/default/img/icons/electron/icon.png"));

	if (process.platform != "darwin") {
		context_menu = Menu.buildFromTemplate([
			{
				label: translate.electron_show,
				click: () => {
					main_window.show();
				}
			},
			{
				label: translate.electron_quit,
				click: function() {
					app.isQuiting = true;
					app.quit();
				}
			}

		]);
	}

	if (config.system.debug === "disabled") {
		main_window.loadFile(`themes_${config.system.language}/${config.site.theme}/pages/index.html`);
	} else {
		main_window.loadURL("http://localhost:3001");
	}

	main_window.openDevTools();

	if (process.platform != "darwin") {
		app_icon.on("click", function(event) {
			event.preventDefault();
			if (main_window.isVisible()) {
				main_window.hide();
			} else {
				main_window.show();
			}
		});

		main_window.on("minimize", function(event) {
			event.preventDefault();
			main_window.hide();
		});

		main_window.on("show", function() {
			app_icon.setHighlightMode("always");
		});

		app_icon.setContextMenu(context_menu);
	}

	main_window.on("closed", function() {
		main_window = null;
	});
}

app.on("ready", create_window);

app.on("window-all-closed", function() {
	app.quit();
});

app.on("activate", function() {
	if (main_window === null) {
		create_window();
	}
});