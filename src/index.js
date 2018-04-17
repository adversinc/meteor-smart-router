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

				bodyTag.removeClass(removeBodyClasses.join(" "));

				// Set new body classes

				var routePath = route
					.replace(/\?.*$/, "")
					.replace(/^\//, "")
					.replace(/[^a-z0-9A-Z]/g, "-")
					.replace(/-{2,}/g, "-");

				if(routePath == "") {
					routePath = "index";
				}

				const bodyClasses = ["page-" + routePath];
				removeBodyClasses.push("page-" + routePath);

				if(defaultSet.bodyClass) {
					let v = defaultSet.bodyClass;
					if(typeof(v) == "string") {
						v = [v];
					}
					Array.prototype.push.apply(bodyClasses, v);
				}
				if(routes[route].bodyClass) {
					let v = routes[route].bodyClass;
					if(typeof(v) == "string") {
						v = [v];
					}

					Array.prototype.push.apply(bodyClasses, v);
					Array.prototype.push.apply(removeBodyClasses, v);
				}

				bodyTag.addClass(bodyClasses.join(" "));

				BlazeLayout.render(layout,
					Object.assign({}, defaultSet, routes[route])
				);
			}
		};

		// Allow authorized accounts only
		opts.triggersEnter = [];
		opts.triggersExit = [];

		if(!currentRoute.allowPublic && typeof AccountsTemplates != "undefined") {
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
