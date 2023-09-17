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
 * 	[key: string]: SmartRouteOptions & RouteParams;
 * }
 */
export interface SmartRouteOptions {
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

/**
 * @enum {String}
 */
export enum RouteType {
	REGULAR,
	SIGNIN,
	SIGNUP,
}