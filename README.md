# HCX

HTML compilation and component utility functions for a framework free or framework light UI.

Core Libaray: 20.1K raw

	1) ES 2017 - 20.1K raw, 11.8K terser compress, 4k gzip
	2) ES 2015 - 36.7K raw, 15.7K terser compress, 5k gzip


# What

HTML Compiler eXtensions (HCX) flips JSX on its head. Rather than make JavaScript handle HTML, HCX makes HTML handle JavaScript more directly.

HCX extends [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) notation, i.e. `${ ... javascript }`, into HTML itself.

HCX provides utility functions you can wrap around existing components or plain old HTMLElement DOM nodes to bind forms to models and
event handlers to anything you can select via CSS.

HCX generally eliminates the need for control flow attribute directives. However, `h-foreach`, `h-forvalues`, `h-forentries`, `h-forkeys` are directly supported
and custom directives can be added.

HCX compeletely eliminates the need for content replacement directives like VUE's `v-text`. You just reference reactive data directly in your HTML, e.g.
instead of `<div v-text="message"></div>` just use `<div>${message}</div>`. This also means that the VUE filter syntax is un-neccesary, e.g.
instead of `<span v-text="message | capitalize"></span>` use `<span>${message.toUpperCase()}</span>` or even the new JavaScript pipe operator when it becomes
available `<span>${message |> capitalize}</span>`.

HCX supports industry standard [Custom HTML Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements). In fact, you can turn any HTMLElement DOM node into a Custom HTML Element.

HCX includes two custom elements: `<hcx-include-element>` and `<hcx-router>`. The router can target any DOM node as a destination and sources its content from
any other DOM node as well as use a RegExp for pattern matching routes. There can be multiple routers on the same page. In fact, multiple routers
can respond to the same `hashchange` events. You can even have a routeless router, <hcx-router></hcx-router>, which will replace its own content with
that of the DOM node having an id that matches the new location hash for a document.

HCX does not use a virtual DOM, it's dependency tracker laser targets just those nodes that need updates. No work has yet been done on
rendering optimization, but 60Hz (which is adequate for most applications) should be achievable.

There is no build environment/pre-compilation required.

# Why

It is hard to find really good full stack developers, let alone ones with UI design skills. And, translating Photoshop designs or even HTML with CSS over to frameworks
with the use of JSX or other mechanisms results in cognitive disconnects, time lags, and missed expectations.

HCX allows designers express a UI as HTML and CSS at whatever micro, macro, or monolithic scale they wish and then hand-off to programmers to
layer in functionality. Designers can continue to adjust much of the HTML while programmers are at work. For designers that wish to code, HCX 
also makes the transition into bits and pieces of JavaScript easier than moving into a full build/code oriented environment.

HCX is a successor to TLX, Template Literal Extensions. It is simpler to use, slightly smaller, and more flexible. It is also far smaller and we think simpler and more
flexible than a buch of other options out there.

HCX lets you set `debugger` points directly in your HTML template literals for WYSYWIG debugging.

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
			window.addEventListener("DOMContentLoaded",() => {
				hcx.compile(document.body,{message:"Hello World!"})();
			});
		</script>
	</head>
	<body>
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
			window.addEventListener("DOMContentLoaded",() => {
				const el = document.getElementById("themessage");
				hcx.compile(el,{message:"Hello World!",date:new Date()})();
			});
		</script>
	</head>
	<body>
		<div id="themessage" date="${date}">${message}</div>
	</body>
</html>
```

## Boolean Attributes

Boolean attributes are handled by attributes of the same name prefixed by a `:`:


```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			window.addEventListener("DOMContentLoaded",() => {
				hcx.compile(document.body,{box1:true,box2:false})();
			});
		</script>
	</head>
	<body>
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
			
		  window.addEventListener("DOMContentLoaded",() => {
		    hcx.compile(document.body,{
		      tableConfig:{
		        header:"My Table",rows:[["a","b","c"],["d","e","f"]
		        },
		      Table
		    })();
		   });
	  </script>
  </head>
  <body>
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
			window.addEventListener("DOMContentLoaded",() => {
				hcx.compile(document.body,{message:"Hello World!"})();
			});
		</script>
	</head>
	<body>
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
			window.addEventListener("DOMContentLoaded",() => {
				hcx.compile(document.body,{message:"Hello World!"})();
			});
		</script>
	</head>
	<body>
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

## Reactivity

Any HTML can be made reactive by passing in a reactor:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			window.addEventListener("DOMContentLoaded",() => {
				const reactive = hcx.reactor({message:"Wait for it ...."});
				hcx.compile(document.body,reactive)();
				setTimeout(() => reactive.message="Hello World!",2000);
			});
		</script>
	</head>
	<body>
		<div>${message}</div>
	</body>
</html>
```

You can also implement a counter with an `on:click` attribute:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			window.addEventListener("DOMContentLoaded",() => {
				const reactive = hcx.reactor({count:0});
				hcx.compile(document.body,reactive)();
			});
		</script>
	</head>
	<body>
		<button on:click="${count++}">Click Count:${count}</button>
	</body>
</html>
```

If you do not need to access the reactor ourside the context of the HTML, you can use a shorthand:

```html
<html>
	<head>
		<script type="module" src="../index.js"></script>
		<script>
			window.addEventListener("DOMContentLoaded",() => {
				hcx.compile(document.body,{count:0},{reactive:true)();
			});
		</script>
	</head>
	<body>
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
			window.addEventListener("DOMContentLoaded",() => {
				const reactive = hcx.reactor({count:0});
				hcx.compile(document.body,reactive)();
			});
		</script>
	</head>
	<body>
		<button onclick="${count++}">Click Count:${count}</button>
	</body>
</html>
```

## Attribute Directives

### h-foreach

### h-forvalues

### h-forentries

### h-forkeys

### Custom Directives

## Core Custom Elements

### hcx-include-element

`<hcx-include-element for="<css selector>">`

### hcx-router

`<hcx-router [path="<string or RegExp>" [, target="<css selector>" [, to="<css selector for content>"]]]>`

#### Routeless Routing

If you just put `<hcx-router></hcx-router>` on a page, then every time the hash on the page changes the content 
inside the router tag will be updated with the content from the DOM node (usually a `<template>`) with the same
id as the hash. Routing could not get any simpler!

### Targeted Routing

If you add a CSS selector as a value to the `target` attribute, the content of the elements matching the selector will
be replaced. You can target multiple elements at the same time with a loose selector! By default, the
target is the router itself.

### Selective Routing

If you specify a value for `path`, then it will be used to match against the new hash without the `#`. If the `path` value
can be converted into a RegExp, that will be used to broaded the match.

### Route Content

If you specificy a CSS selector for the `to` attribute, the content of the first element matching the selector will be
used as the content for the target area.

### Multiple Routes

You can put multiple routes on the same page. This can be used to match route tags like VUE router-links, e.g.:

```
<hcx-router path="path1" target="#app" to="#pathonecontent"></hcx-router>
<hcx-router path="path2" target="#app" to="#pathtwocontent"></hcx-router>
```

### Functional Routes

You can add an event listener to a route:

```javascript
const router = document.querySelector(<route css selector>);
router.addEventListener("route",(event) => { // if you make this async, event.preventDefault() will not work
	const {selector,targets} = event;
	// event.preventDefault(); // call this if your event handler actually does the routing
	// selector = css selector to get content based on route defition
	// targets = the DOM elements to update based on route definition
	... some logic, perhaps to retrieve remote content
});

```

# Notes

There has been limited testing or focus on optimization.

# Release History (Reverse Chronological Order)

2020-01-27 v0.0.05 ALPHA - Documentation updates

2020-01-27 v0.0.04 ALPHA - Documentation updates

2020-01-27 v0.0.03 ALPHA - Added routeless router and model exports upon creation

2020-01-27 v0.0.02 ALPHA - Added `<hcx-include-element>` and `<hcx-router>`. Various bug fixes.

2020-01-24 v0.0.01 ALPHA - Initial release
