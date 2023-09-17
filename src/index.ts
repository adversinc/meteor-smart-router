/**
 * The route entry type.
 *
 * To be extended by template params used as names of templates in layout
 * ("top", "left" etc)
 *
 * @example
 * interface RouteParams {
 *   main?: string;
 * }
 *
 * export interface RouteSet {
 * 	[key: string]: Route & RouteParams;
 * }
 */
export interface Route {
	/** The path of the parent route (used for title etc) */
	parent?: string;
	/** The layout to use for this route (e.g. "App_Layout") */
	layout?: string;
	/** The route type (default REGULAR) */
	type?: RouteType;
	/** Is this page can be accessed without Meteor.userId() */
	allowPublic?: boolean;
	/** If logged in, redirect user to this route */
	redirectIfLogged?: string;
	/** The class name to add to the body when this route is active */
	bodyClass?: string[] | string;
	/** The window title. With be joined with parent's one using dashes */
	title?: string;
	/**
	 * The function to load template dynamically
	 * @example
	 * "/path": {
	 * 	dynamicTemplate() {
	 * 		return import("/imports/ui/pages/public/text-pages/terms")
	 * 	},
	 * }
	 */
	dynamicTemplate?: () => Promise<any>;
}

interface GenericRouteSet {
	[key: string]: Route;
}

interface FlowRouterCustomOpts {
	initialOptions: Route;
}

/**
 * @enum {String}
 */
export enum RouteType {
	REGULAR,
	SIGNIN,
	SIGNUP,
}

/**
 * The classes to automatically remove on next route entry. The automatically
 * added "page-*" body class goes here to be removed in next route.
 *
 * An array is being used to ensure that all "page-*" classes are removed,
 * even if user switches routes VERY quick.
 * @type {Array}
 */
const removeBodyClasses = [];

Tracker.autorun(() => {
	const pt = Session.get("document.title");
	// Use `-` symbol at the end of string for join without -
	if(pt) {
		if(pt.endsWith("-")) {
			document.title = pt.substring(0, pt.length-1) + document._originalTitle;
		} else {
			document.title = pt + " - " + document._originalTitle;
		}
	}
});

/**
 * Automatically generate routes based on a given config.
 * @param defaultSet {Object} - default settings for all routes
 * @param routes {Object} - the set of routes
 */
export function route(defaultSet: Route, routes: GenericRouteSet) {
	Object.keys(routes).forEach(function (route) {
		const currentRoute = routes[route];

		let layout = defaultSet.layout;
		if(currentRoute.layout !== undefined) {
			layout = currentRoute.layout;
		}

		const opts: FlowRouterRouteParameters & FlowRouterCustomOpts = {
			action: function() {
				let titles = [defaultSet.title];
				if(currentRoute.parent && routes[currentRoute.parent]) {
					titles.unshift(routes[currentRoute.parent].title);
				}
				if(currentRoute.title) {
					titles.unshift(routes[route].title);
				}
				document.title = titles.join(" - ");
				document._originalTitle = document.title;

				// Remove previous body classes
				const bodyTag = $("body");

				const remClasses = [...removeBodyClasses];

				// Set new body classes
				var routePath = route
					.replace(/\?.*$/, "")
					.replace(/^\//, "")
					.replace(/[^a-z0-9A-Z_]/g, "-")
					.replace(/-{2,}/g, "-");

				if(routePath === "") {
					routePath = "index";
				}

				const bodyClasses = ["page-" + routePath];
				removeBodyClasses.length = 0;
				removeBodyClasses.push("page-" + routePath);

				if(defaultSet.bodyClass) {
					let v = defaultSet.bodyClass;
					if(typeof(v) === "string") {
						v = [v];
					}
					Array.prototype.push.apply(bodyClasses, v);
				}
				if(routes[route].bodyClass) {
					let v = routes[route].bodyClass;
					if(typeof(v) === "string") {
						v = [v];
					}

					Array.prototype.push.apply(bodyClasses, v);
					Array.prototype.push.apply(removeBodyClasses, v);
				}

				// Add required classes
				bodyTag.addClass(bodyClasses.join(" "));

				// Compare and see which classes should be removed in next tick
				const filteredRemClasses = remClasses.filter((el) => {
					return bodyClasses.indexOf(el) < 0;
				});
				Meteor.defer(() => {
					bodyTag.removeClass(filteredRemClasses.join(" "));
				});


				BlazeLayout.render(layout,
					// @ts-ignore BlazeLayoutStatic is too simple to accept routes
					Object.assign({}, defaultSet, routes[route])
				);
			},

			initialOptions: currentRoute
		};

		// Allow authorized accounts only
		opts.triggersEnter = [];
		opts.triggersExit = [];

		if (!currentRoute.allowPublic) {
			if(typeof AccountsTemplates !== "undefined") {
				opts.triggersEnter.push(AccountsTemplates.ensureSignedIn);
			} else {
				opts.triggersEnter.push(() => {
					customEnsureSignedIn(currentRoute, routes);
				});
			}
		}

		// If logged in, and redirectIfLogged, then redirect
		if(currentRoute.redirectIfLogged) {
			opts.triggersEnter.push(async() => {
				// @ts-ignore Need meteor types 2+, but they pull a lot of deps
				if(Meteor.userId() && await Meteor.userAsync()) {
					FlowRouter.go(currentRoute.redirectIfLogged);
				}
			});
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


/**
 * Called when specific route is !allowPublic, and we are not using
 * MeteorTemplates
 * @param currentRoute
 * @param routes
 */
function customEnsureSignedIn(currentRoute, routes) {
	// If not logged in, find the "SIGNUP" route and redirect there
	if(Meteor.userId && Meteor.userId() === null) {
		Object.keys(routes).forEach((route) => {
			if(routes[route].type === RouteType.SIGNIN) {
				FlowRouter.go(route);
			}
		});
	}
}
