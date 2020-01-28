# HCX

HTML compilation and component utility functions for a framework free or framework light UI.

Core Libaray: 20.1K raw

	1) ES 2017 - 20.1K raw, 11.8K terser compress, 4k gzip
	2) ES 2015 - 36.7K raw, 15.7K terser compress, 5k gzip


# What

HTML Compiler eXtensions (HCX) flips JSX on its head. Rather than make JavaScript handle HTML, HCX makes HTML handle JavaScript more directly.

HCX extends [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) notation, i.e. `${ ... javascript }`, into HTML itself.

HCX provides utility functions you can wrap around existing components or plain old HTMLElement DOM nodes to [bind forms to models](#binding-inputs) and
[event handlers](#adding-event-handlers) to anything you can select via CSS.

HCX generally eliminates the need for control flow attribute directives. However, [`h-foreach`](#h-foreach), [`h-forvalues`](#h-forvalues), 
[`h-forentries`](#h-forentries), (`h-forkeys`)[#h-forkeys] are directly supported and [custom directives](#custom-directives) can be added.

HCX compeletely eliminates the need for content replacement directives like VUE's `v-text`. You just reference [reactive data](#reactivity) directly in your HTML, e.g.
instead of `<div v-text="message"></div>` just use `<div>${message}</div>`. This also means that the VUE filter syntax is un-neccesary, e.g.
instead of `<span v-text="message | capitalize"></span>` use `<span>${message.toUpperCase()}</span>` or even the new JavaScript pipe operator when it becomes
available `<span>${message |> capitalize}</span>`.

HCX lets you set [`debugger` points](#debugging) directly in your HTML template literals for WYSYWIG debugging.

HCX supports industry standard [Custom HTML Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements). In fact, you can turn any HTMLElement DOM node into a Custom HTML Element.

HCX includes two custom elements: [`<hcx-include-element>`](#hcx-include-element) and [`<hcx-router>`](#hcx-router). The router can target any DOM node as a destination and sources its content from
any other DOM node or a remote file. It can also use a RegExp for pattern matching routes. There can be multiple routers on the same page. In fact, multiple routers
can respond to the same `hashchange` events. You can even have a routeless router, <hcx-router></hcx-router>, which will replace its own content with
that of the DOM node having an id that matches the new location hash for a document.

HCX does not use a virtual DOM, it's dependency tracker laser targets just those nodes that need updates. No work has yet been done on
rendering optimization, but 60Hz (which is adequate for most applications) should be achievable.

HCX allows designers express a UI as HTML and CSS at whatever [micro](#templates-and-remote-content), macro, or monolithic scale they wish and then hand-off to programmers to
layer in functionality. Designers can continue to adjust much of the HTML while programmers are at work. For designers that wish to code, HCX 
also makes the transition into bits and pieces of JavaScript easier than moving into a full build/code oriented environment.

HCX is a successor to TLX, Template Literal Extensions. It is simpler to use, slightly smaller, and more flexible. It is also far smaller and we think simpler and more
flexible than a buch of other options out there.

There is no build environment/pre-compilation required.

# Usage

At the moment, you must use HCX via a JavaScript module. As we approach a production ready implementation, a Webpack/Babel processed `dist` directory 
will be available. HCX curently runs in the most recent versions of Chrome, Firefox, and Edge.

`npm install hcx`

If you don't want to copy files out of `node_modules/hcx` and are using Express, try [modulastic](https://www.npmjs.com/package/modulastic) to expose the hcx files directly.

Partial documentation exists below. Also see the `examples/messy-closet.hml` file to see how to use specific functions. 

More documentation coming ...

## Basic Use

In the most simple case, a document body can be bound to a model and rendered:


```html
<html>
	<head>
	<script type="module" src="../index.js"></script>
	<script>
		const loaded = () => hcx.compile(document.body,{message:"Hello World!"})())
	</script>
	</head>
	<body onload="loaded(event)">
		<div>${message}</div>
	</body>
</html>
```

Sub-nodes and attributes can also be targetted:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				const el = document.getElementById("themessage");
				hcx.compile(el,{message:"Hello World!",date:new Date()})();
			};
		</script>
	</head>
	<body onload="loaded(event)">
		<div id="themessage" date="${date}">${message}</div>
	</body>
</html>
```

## Templates and Remote Content

Templates with encapsulated styles can be compiled and rendered at a later time with new model data:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				const el = document.getElementById("mytemplate"),
					compiled = hcx.compile(el)();
				setTimeout(() => {
					const shadow = true;
					compiled({message:"Hello World!",date:new Date()},document.getElementById("themessage"),shadow)
				})
			};
		</script>
		<template id="mytemplate">
			<style>
				div {
					font-size: 150%
				}
			</style>
			<div date="${date}">${message}</div>
		</template>
	</head>
	<body onload="loaded(event)">
		<div>Here is the message:</div>
		<div id="themessage"></div>
	</body>
</html>
```

For micro-UI design, components can be stored as separate UI files with their own styles:

```html
<html>
	<head>
		<!-- 
			anything in the head will be ignored if the file is loaded as remote content source
			however, it loaded directly, the head will be used
			perfect for ui component previewing!
		 -->
		<script>
			const loaded = () => {
				document.body.appendChild(new Text("PREVIEW MODE"))
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<style>
			div {
				font-size: 150%
			}
		</style>
		<div date="${date}">And the message is: ${message}</div>
	</body>
<html>
```

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = async () => {
				const file = await fetch("./micro-ui-template.html"),
					text = await file.text(),
					el = hcx.asDOM(text);
					compiled = hcx.compile(el.body ? el.body : el);
				setTimeout(() => {
					const shadow = true;
					compiled({message:"Hello World!",date:new Date()},document.getElementById("themessage"),shadow)
				})
			};
		</script>
	</head>
	<body onload="loaded(event)">
		<div>Here is the message:</div>
		<div id="themessage"></div>
	</body>
</html>
```

See the hcx-router section on [Remote Content](#remote-content) for even simpler remote templates.

## Boolean Attributes

Boolean attributes are handled by attributes of the same name prefixed by a `:`:


```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				hcx.compile(document.body,{box1:true,box2:false})();
			});
		</script>
	</head>
	<body onload="loaded(event)">
		Box1: <input type="checkbox" :checked="${box1}">
		Box2: <input type="checkbox" :checked="${box2}">
	</body>
</html>
```

## Basic Components

A component is any function that returns an HTMLElement. You can roll your own or use the `hcx` string template literal parser for
assistance:

```html
<html>
  <head>
    <script type="module" src="../index.js"></script>
	  <script>
		  const Table = ({header="",headings=[],rows=[]}) => { // a table that adjusts to its headings and rows
		    const cols = Math.max(headings.length,rows.reduce((accum,row) => accum = Math.max(accum,row.length),0));
		    rows = rows.map((row) => row.length<cols ? row.slice().concat(new Array(cols-row.length)) : row); // pad rows
		  return hcx`
		    <table>
		    ${header ? `<thead id="header"><tr><th colspan="${cols}">${header}</th></tr></thead>` : ''}
		    ${headings.length>0 ? `<thead><tr>${headings.reduce((accum,heading) => accum += `<th>${heading}</th>`,"")}</tr></thead>` : ''}
		    ${rows.length>0
		        ? `<tbody>${rows.reduce((accum,row) => 
		                    accum += `<tr>${row.reduce((accum,value) => accum += `<td>${value==null ? '' : value}</td>`,"")}</tr>`,"")}
		          </tbody>` 
		        : ''}
		    </table>`
		  };
			
		  const loaded = () => {
		    hcx.compile(document.body,{
		      tableConfig:{
		        header:"My Table",rows:[["a","b","c"],["d","e","f"]]
		        },
		      Table
		    })();
		   }
	  </script>
  </head>
  <body onload="loaded(event)">
    ${Table(tableConfig)}
  </body>
</html>

````

Produces

<table>
<thead id="header"><tr><th colspan="3">My Table</th></tr></thead>
<tbody><tr><td>a</td><td>b</td><td>c</td></tr><tr><td>d</td><td>e</td><td>f</td></tr></tbody>
</table>


## Including Logic

Arbitrarily complex JavaScript logic can be included by enclosing the script in a special comment starting with `<!--hcx`:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				hcx.compile(document.body,{message:"Hello World!"})();
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<div>
		<!--hcx
		${
			`<ul>
			${
				["jack","jane","john"].reduce((accum,item) => {
					accum += `<li>${item}</li>`;
					return accum;
				},"")
			}
			</ul>`
		}
		</div>
        -->
	</body>
</html>
```

## Debugging

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loded = () => {
				hcx.compile(document.body,{message:"Hello World!"})();
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<div>
		<!--hcx
		${
			`<ul>
			${
				["jack","jane","john"].reduce((accum,item) => {
					debugger;
					accum += `<li>${item}</li>`;
					return accum;
				},"")
			}
			</ul>`
		}
		</div>
        -->
	</body>
</html>
```

## Binding Inputs

TO BE WRITTEN

## Reactivity

Any HTML can be made reactive by passing in a reactor:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				const reactive = hcx.reactor({message:"Wait for it ...."});
				hcx.compile(document.body,reactive)();
				setTimeout(() => reactive.message="Hello World!",2000);
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<div>${message}</div>
	</body>
</html>
```

## Adding Event Handlers

You can implement a reactive counter with an `on:click` attribute:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				const reactive = hcx.reactor({count:0});
				hcx.compile(document.body,reactive)();
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<button on:click="${count++}">Click Count:${count}</button>
	</body>
</html>
```

If you do not need to access the reactor outside the context of the HTML, you can use a shorthand:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				hcx.compile(document.body,{count:0},{reactive:true)();
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<button on:click="${count++}">Click Count:${count}</button>
	</body>
</html>
```

Regular 'on...' attributes can also be used (although they may result in a console warning about an unexpected '{' token):

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			const loaded = () => {
				const reactive = hcx.reactor({count:0});
				hcx.compile(document.body,reactive)();
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<button onclick="${count++}">Click Count:${count}</button>
	</body>
</html>
```

Finally, you can add event handlers to multiple HTML elements with a single call:

`addEventListeners(component,listeners={})` - `component` can be a function returning an `HTMLElement` or an actual `HTMLElement`.

The `listeners` object can have the following:

1) property names that are CSS selectors and values that are event handling functions, e.g.

```javascript
{
	"[name]": function(event) { ... some code ...} // add to all sub-elements that have a name attribute
}

```

2) a property named `on` with subkey functions named using the normal event names, e.g. 'focus', 'click':

```javascript
{
	on: 
		{
			click(event) { ... some code ... },
			focus(event) { ... some code ...}
		}
}
```

These will be registered as the respective event handlers for the event types on the component.

3) property functions named using the normal `on<fname>` approach, e.g. `onclick`:

```javascript
{
	onclick(event) { ... some code ...},
	onfocus(event) { ... some code ...}
}
```

These will be registered as the respective event handlers for the event types on the component.

4) arbitrary property functions, e.g.

```javascript
{
	myfunction(event) { ... some code ... }
}
```

These will replace attributes of the form `onclick="hcx.myfunction(event)"` on the component.




## Attribute Directives

### h-foreach

### h-forvalues

### h-forentries

### h-forkeys

### Custom Directives

There are two core custom directives, but you can add your own. TO BE WRITTEN.

## Core Custom Elements

### hcx-include-element

Just put `<hcx-include-element for="<css selector>"></hcx-include-element>` in your document and the content of the element selected by `for`
will be inserterd inside the tags.

### hcx-router

Include the module `hcx-router.html`.

`<hcx-router [path="<string or RegExp>" [, target="<css selector>" [, to="<css selector for content>"]]]>`

#### Routeless Routing

If you just put `<hcx-router></hcx-router>` on a page, then every time the hash on the page changes the content 
inside the router tag will be updated with the content from the DOM node (usually a `<template>`) with the same
id as the hash. Routing could not get any simpler!

#### Targeted Routing

If you add a CSS selector as a value to the `target` attribute, the content of the elements matching the selector will
be replaced. You can target multiple elements at the same time with a loose selector! By default, the
target is the router itself.

#### Selective Routing

If you specify a value for `path`, then it will be used to match against the new hash without the `#`. If the `path` value
starts with a `/` and can be converted into a RegExp, that will be used to broaded the match. Hence, do not start regular paths with a `/`.

#### Parameterized Routes

If the `path` attribute contains parameters, e.g. `/user/:id`, or a query string, the parameters will be parsed and used as the data model
during the rendering process.

#### Route Content

If you specificy a CSS selector for the `href` attribute, the content of the first element matching the selector will be
used as the content of a shadow DOM in the target area. A shadow DOM is used so that if the source contains `<style>` elements,
they will not polute the rest of the document.

#### Remote Content

If the `href` attribute value does not result in the matching of an HTML element, an attempt is made to convert the value to a URL and
retrieve the file at the URL. If the file can be retrieved and successfully parsed as HTML with a body, the body is used. If it
is HTML without a body, then all the HTML is used.

The use of remote content is ideal for micro-UI design. Each element of the UI can be designed and previewed in its own HTML file with its own styling.

#### Multiple Routes

You can put multiple routes on the same page. This can be used to match route tags like VUE router-links, e.g.:

```
<hcx-router path="path1" target="#app" to="#pathonecontent"></hcx-router>
<hcx-router path="path2" target="#app" to="#pathtwocontent"></hcx-router>
```

#### Functional Routes

You can add an event listener to a route:

```javascript
const router = document.querySelector(<route css selector>);
router.addEventListener("route",(event) => { // if you make this async, event.preventDefault() will not work
	const {selector,targets} = event;
	// event.preventDefault(); // call this if your event handler actually does the routing
	// selector = css selector or perhaps a path to get content based on route definition
	// targets = the DOM elements to update based on route definition
	... some logic, perhaps to retrieve remote content
});

```

# Notes

There has been limited testing or focus on optimization.

# Release History (Reverse Chronological Order)

2020-01-28 v0.0.07 ALPHA - Micro-UI design support. `addEventListeners` improvements.

2020-01-28 v0.0.06 ALPHA - Documentation updates. Remote and parameterized routes added.

2020-01-27 v0.0.05 ALPHA - Documentation updates

2020-01-27 v0.0.04 ALPHA - Documentation updates

2020-01-27 v0.0.03 ALPHA - Added routeless router and model exports upon creation

2020-01-27 v0.0.02 ALPHA - Added `<hcx-include-element>` and `<hcx-router>`. Various bug fixes.

2020-01-24 v0.0.01 ALPHA - Initial release
