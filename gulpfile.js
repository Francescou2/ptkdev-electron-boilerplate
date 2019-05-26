/**
 * Gulp Config
 * =====================
 * Automation task
 *
 * @contributors: Patryk Rzucidło [@ptkdev] <support@ptkdev.io> (https://ptk.dev)
 *
 * @license: MIT License
 *
 */
const argv = require("yargs").argv;
const gulp = require("gulp");
const gulp_run = require("gulp-run");
const gulp_concat = require("gulp-concat");
const gulp_sass = require("gulp-sass");
const gulp_minifycss = require("gulp-clean-css");
const gulp_minifyjs = require("gulp-terser");
const gulp_nunjucks = require("gulp-nunjucks");
const gulp_nunjucks_render = require("gulp-nunjucks-render");
const gulp_data = require("gulp-data");
const gulp_rename = require("gulp-rename");
const nodemon = require("gulp-nodemon");
const browsersync = require("browser-sync").create();
const Utils = require("./modules/commons/utils");
const utils = new Utils();

let config = (argv.config ? require(argv.config) : require("./configs/config.js"));
config = utils.fix_config(config);

let cookie = {"style:": "default"};
let language = (argv.language ? argv.language : config.system.language);

/**
* Task: build-css & build-js + nunjucks
* =====================
* Minify and concat js and css files
*
*/
gulp.task("build-css", function() {
	return gulp.src([`./themes/${config.site.theme}/css/vendor/bulma/bulma.min.css`, `./themes/${config.site.theme}/css/main.scss`, `./themes/${config.site.theme}/css/animate.scss`])
		.pipe(gulp_concat({path: "./full.min.tmp"}))
		.pipe(gulp_sass())
		.pipe(gulp_minifycss())
		.pipe(gulp_rename("full.min.css"))
		.pipe(gulp.dest(`./themes/${config.site.theme}/css/`))
		.pipe(browsersync.stream());
});

gulp.task("build-css-skeleton", function() {
	return gulp.src([`./themes/${config.site.theme}/css/skeleton.scss`])
		.pipe(gulp_concat({path: "./skeleton.min.tmp"}))
		.pipe(gulp_sass())
		.pipe(gulp_minifycss())
		.pipe(gulp_rename("skeleton.min.css"))
		.pipe(gulp.dest(`./themes/${config.site.theme}/css/`));
});

gulp.task("build-css-skin-default", function() {
	return gulp.src([`./themes/${config.site.theme}/css/skin-default.scss`])
		.pipe(gulp_concat({path: "./skin-default.min.tmp"}))
		.pipe(gulp_sass())
		.pipe(gulp_minifycss())
		.pipe(gulp_rename("skin-default.min.css"))
		.pipe(gulp.dest(`./themes/${config.site.theme}/css/`))
		.pipe(browsersync.stream());
});

gulp.task("build-css-skin-nightmode", function() {
	return gulp.src([`./themes/${config.site.theme}/css/skin-nightmode.scss`])
		.pipe(gulp_concat({path: "./skin-nightmode.min.tmp"}))
		.pipe(gulp_sass())
		.pipe(gulp_minifycss())
		.pipe(gulp_rename("skin-nightmode.min.css"))
		.pipe(gulp.dest(`./themes/${config.site.theme}/css/`))
		.pipe(browsersync.stream());
});

gulp.task("build-js", function() {
	let jsarray = [`./themes/${config.site.theme}/js/vendor/cash-dom/cash.min.js`, `./themes/${config.site.theme}/js/vendor/lazyload/lazyload.min.js`, `./themes/${config.site.theme}/js/main.js`, `./themes/${config.site.theme}/js/skin-switcher.js`, `./themes/${config.site.theme}/js/routes.js`, `./themes/${config.site.theme}/js/policy/cookielaw.js`, `./themes/${config.site.theme}/js/main.js`, `./themes/${config.site.theme}/js/events.js`];

	if (config.site.pwa.status === "enabled") {
		jsarray.push(`./themes/${config.site.theme}/js/pwa/prompt.js`);
		jsarray.push(`./themes/${config.site.theme}/js/pwa/update.js`);
	}

	return gulp.src(jsarray)
		.pipe(gulp_concat({path: "full.min.tmp"}))
		.pipe(gulp_nunjucks.compile({config: config, translate: require(`./translations/${language}`)}))
		.pipe(gulp_minifyjs())
		.pipe(gulp_rename("full.min.js"))
		.pipe(gulp.dest(`./themes/${config.site.theme}/js/`));
});

gulp.task("build-static-nunjucks", function() {
	return gulp.src([`./themes_tmp/${config.site.theme}/pages/**/*.html`])
		.pipe(gulp_data({config: config, translate: require(`./translations/${language}`), cookie: cookie}))
		.pipe(gulp_nunjucks_render({
			envOptions: {autoescape: false},
		    path: [`./themes_tmp/${config.site.theme}/`]
	    }))
		.pipe(gulp.dest(`./themes_tmp/${config.site.theme}/pages/`));
});

gulp.task("build-css-skin", gulp.parallel("build-css-skin-default", "build-css-skin-nightmode"));
gulp.task("build-static", gulp.parallel("build-css", "build-css-skeleton", "build-css-skin", "build-js"));

/**
* Task: browser-sync
* =====================
* Start browser sync in combo with express: auto refresh files and browser page.
*
*/
gulp.task("browser-sync", function() {
	browsersync.init({
		port: parseInt(config.server.bs_port),
		proxy: `http://localhost:${parseInt(config.server.express_port)}`,
		ui: {port: parseInt(config.server.ui_port)},
		open: false,
		reloadDelay: 500
	});

	nodemon({
		script: "app.js",
		"watch": ["./app.js",
			      "./modules/**/*",
			      "./translations/**/*",
			      "./configs/**/*",
			      `./themes/${config.site.theme}/**/*.html`,
			      `./themes/${config.site.theme}/css/skeleton.min.css`,
			      `./themes/${config.site.theme}/js/full.min.js`
			     ],
		"ext": "js, html, css"
	}).on("restart", function() {
		browsersync.reload();
	});

	gulp.watch([`./themes/${config.site.theme}/**/*.scss`, `!./themes/${config.site.theme}/css/skeleton.scss`, `!./themes/${config.site.theme}/css/skin-default.scss`, `!./themes/${config.site.theme}/css/skin-nightmode.scss`]).on("change", gulp.parallel("build-css"));
	gulp.watch([`./themes/${config.site.theme}/css/skeleton.scss`]).on("change", gulp.parallel("build-css-skeleton"));
	gulp.watch([`./themes/${config.site.theme}/css/skin-default.scss`, `./themes/${config.site.theme}/css/skin-nightmode.scss`]).on("change", gulp.parallel("build-css-skin"));

	gulp.watch(["./configs/**/*", `./themes/${config.site.theme}/**/*.js`, `!./themes/${config.site.theme}/js/full.min.js`]).on("change", gulp.parallel("build-js"));
});

gulp.task("electron", function() {
	gulp_run("npm run dev-electron").exec();
});

/**
* Task: server
* =====================
* Run in combo gulp-nodemon + browser-sync tasks
*
*/
gulp.task("server", gulp.parallel("browser-sync", "electron"));