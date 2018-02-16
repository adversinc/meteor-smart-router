/*
 * Routes. Should be called _before_ all other files to ensure that our
 * custom routes (e.g. signup) have a priority over useraccounts
 *
 * ROUTE SETTINGS
 *
 * 	layout (optional) - the layout to use
 * 	main - the template to use for main slot
 * 	top - template to put in top slot of the layout
 * 	left - template to put in left slot of the layout
 *
 * ROUTE INHERITANCE
 *
 * Route can be marked as a child of another route, by using a "parent"
 * field. Currently this only affects a page title generation.
 *
 * DYNAMIC TEMPLATES
 *
 * Route can load template dynamically, thus allowing other pages load
 * faster. This is being done using Meteor dynamic module loading.
 *
 * To have route template load dynamically, add the following function to route:
 * dynamicTemplate: () =>
 * 	{ return import("/imports/ui/pages/maintenance/code.js") },
 *
 * This makes template module dynamic, and its code will load only on actual
 * route request.
 *
 * Important: as of 1.5.2, Meteor requires to see
 * an IMPICIT module load directive "import('/import/...../code.js')"
 * in the code. Thus, "dynamicTemplate" have to stay a function with an
 * implicit code inside.
 *
 * PAGE BODY CLASSES
 *
 * To allow styling individual pages, router automatically ads the class
 * named according to the page route, e.g.:
 * 	page-index
 * 	page-new-message
 *
 * This class is being added on route render and removed just before the new
 * route is being rendered.
 *
 * Also, to (possibly) notify user about page loading, router adds
 * "routers-switching" class to the body while new route is loading.
 *
 * PAGE TITLE
 *
 * Page title is being constructed using:
 * 1. current route "title" value
 * 2. the value of the "parent" route (see ROUTE INHERITANCE)
 * 3. the default title
 *
 * These values are being joined with " - ".
 *
 * TODO
 *
 * 1. Add redirectIfLogged support (it is being used somewhere)
 *
 */


/**
 * The classes to automatically remove on next route entry. The automatically
 * added "page-*" body class goes here to be removed in next route.
 *
 * An array is being used to ensure that all "page-*" classes are removed,
 * even if user switches routes VERY quick.
 * @type {Array}
 */
const removeBodyClasses = [];

/**
 * Automatically generate routes based on a given config.
 * @param defaultSet {Object} - default settings for all routes
 * @param routes {Object} - the set of routes
 */
function route(defaultSet, routes) {
	Object.keys(routes).forEach((route) => {
		const currentRoute = routes[route];

		let layout = defaultSet.layout;
		if(currentRoute.layout !== undefined) {
			layout = currentRoute.layout;
		}

		const opts = {
			action() {
				let titles = [defaultSet.title];
				if(currentRoute.parent && routes[currentRoute.parent]) {
					titles.unshift(routes[currentRoute.parent].title);
				}
				if(currentRoute.title) {
					titles.unshift(routes[route].title);
				}
				document.title = titles.join(" - ");

				// Remove previous body classes
				const bodyTag = $("body");

				removeBodyClasses.forEach((c) => {
					bodyTag.removeClass(c);
				});

				// Set new body classes

				var routePath = route
					.replace(/\?.*$/, "")
					.replace(/^\//, "")
					.replace(/[^a-z0-9A-Z]/g, "-")
					.replace(/-{2,}/g, "-");

				if(routePath == "") {
					routePath = "index";
				}

				bodyTag.addClass("page-" + routePath);
				bodyTag.addClass(routes[route].bodyClass);

				removeBodyClasses.push("page-" + routePath, routes[route].bodyClass);

				BlazeLayout.render(layout,
					Object.assign({}, defaultSet, routes[route])
				);
			}
		};

		// Allow authorized accounts only
		opts.triggersEnter = [];
		opts.triggersExit = [];

		if(!currentRoute.allowPublic) {
			opts.triggersEnter.push(AccountsTemplates.ensureSignedIn);
		}

		opts.triggersExit.push(() => {
			$("body").addClass("routers-switching");
			removeBodyClasses.push("routers-switching");
		});

		// Allow dynamic import templates. This is being used for maintenance
		// pages to prevent loading them automatically to every client
		if(currentRoute.dynamicTemplate) {
			// The magic is to load template in action() and then render it
			const tmplLoad = currentRoute.dynamicTemplate;
			const oldAction1 = opts.action;

			opts.action = async() => {
				// Load template
				await tmplLoad();
				// Perform the action we planned before
				// console.log("performing old action3", oldAction);
				oldAction1();
			};
		}

		//
		// Add route
		FlowRouter.route(route, opts);
	});
}

export default {
	route,
};
