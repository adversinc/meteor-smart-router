This is a Meteor FlowRouter helper which allows setting up routes with less
boilerplate. Basically, the routes are being prepared as a set of
properties.

Still much to do.

Should be called _before_ all other files to ensure that our
custom routes (e.g. signup) have a priority over useraccounts

ROUTE SETTINGS
-----

* layout (optional) - the layout to use
* main - the template to use for main slot
* top - template to put in top slot of the layout
* left - template to put in left slot of the layout

ROUTE INHERITANCE
-----

Route can be marked as a child of another route, by using a "parent"
field. Currently this only affects a page title generation.

DYNAMIC TEMPLATES
-----

Route can load template dynamically, thus allowing other pages load
faster. This is being done using Meteor dynamic module loading.

To have route template load dynamically, add the following function to route:

```
dynamicTemplate: () =>
	{ return import("/imports/ui/pages/maintenance/code.js") },
```

This makes template module dynamic, and its code will load only on actual
route request.

Important: as of 1.5.2, Meteor requires to see
an IMPICIT module load directive "import('/import/...../code.js')"
in the code. Thus, "dynamicTemplate" have to stay a function with an
implicit code inside.

PAGE BODY CLASSES
-----

To allow styling individual pages, router automatically ads the class
named according to the page route, e.g.: page-index, page-new-message

This class is being added on route render and removed just before the new
route is being rendered.

Also, to (possibly) notify user about page loading, router adds
"routers-switching" class to the body while new route is loading.

PAGE TITLE
-----

Page title is being constructed using:
1. current route "title" value
2. the value of the "parent" route (see ROUTE INHERITANCE)
3. the default title

These values are being joined with " - ".

TODO
-----

1. Add redirectIfLogged support (it is being used somewhere)
