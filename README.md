# HCX

HTML Compiler - Routeless, targetless, remote, runnable routes and more ...

Core Library:

	1) ES 2017 - 24.2K raw, 13.7K terser compress, 4.5k gzip


# What

HTML Compiler eXtensions (HCX) flips JSX on its head. Rather than make JavaScript handle HTML, HCX makes HTML handle JavaScript more directly.

HCX extends [JavaScript template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) notation, i.e. `${ ... javascript }`, into HTML itself.

HCX provides utility functions you can wrap around existing components or plain old HTMLElement DOM nodes to [bind forms to models](#binding-inputs) and
[event listeners](#adding-event-listeners) to anything you can select via CSS.

HCX generally eliminates the need for control flow attribute directives. However, [`h-foreach`](#h-foreach), [`h-forvalues`](#h-forvalues), 
[`h-forentries`](#h-forentries), (`h-forkeys`)[#h-forkeys] are directly supported and [custom directives](#custom-directives) can be added.

HCX compeletely eliminates the need for content replacement directives like VUE's `v-text`. You just reference [reactive data](#reactivity) directly in your HTML, e.g.
instead of `<div v-text="message"></div>` just use `<div>${message}</div>`. This also means that the VUE filter syntax is un-neccesary, e.g.
instead of `<span v-text="message | capitalize"></span>` use `<span>${message.toUpperCase()}</span>` or even the new JavaScript pipe operator when it becomes
available `<span>${message |> capitalize}</span>`.

HCX lets you set [`debugger` points](#debugging) directly in your HTML template literals for WYSYWIG debugging.

HCX supports [industry standard](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) [Custom HTML Elements](#custome-elements). In fact, you can turn any HTMLElement DOM node into a Custom HTML Element.

HCX introduces the concept of [runnable templates](#runnable-templates).

HCX includes two custom elements: [`<hcx-include-element>`](#hcx-include-element) and [`<hcx-router>`](#hcx-router). The router can target any DOM node as a destination and sources its content from
any other DOM node or a remote file. It can also use a RegExp for pattern matching routes. There can be multiple routers on the same page. In fact, multiple routers
can respond to the same `hashchange` events. You can even have a routeless router, <hcx-router></hcx-router>, which will replace its own content with
that of the DOM node having an id that matches the new location hash for a document.

HCX does not use a virtual DOM, it's dependency tracker laser targets just those nodes that need updates. No work has yet been done on
rendering optimization, but 60Hz (which is adequate for most applications) should be achievable.

HCX allows designers to express a UI as HTML and CSS at whatever [micro](#templates-and-remote-content), macro, or monolithic scale they wish and then hand-off to programmers to
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
	<script type="module" src="../hcx.js"></script>
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
		<script type="module" src="../hcx.js"></script>
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

The full signature for compile is:

`hcx.compile(el,model,{imports,exports,reactive,inputs,listeners,properties,shadow,runnable}={})`

`el` - HTML element

`model` - An optional object to use as a data source.

`imports` - An optional array, the values of of which are attributes to copy onto the `model`.

`exports` - An optional array of model keys used to add data properties directly to the element or to set as attribute values.

`reactive` - An optional boolean which if truthy makes the `model` into a reactor such that any time it changes portions of the `el` referencing the changed properties will be re-rendered. See [Reactivity}(#reactivity).

`inputs` - Defaults to '"*"` to bind a all inputs to the `model`. Can also be an array of input ids. See [Binding Inputs](#binding-inputs).

`listeners` - An optional object holding Event listeners to add. See [Adding Event Listeners](#adding-event-listeners).

`properties` - An optional object on data and methods to add directly to `el` when it is rendered.

`shadow` - An optional boolean, defaulting to `true`, which if causes the `innerHTML` to be rendered in a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM).

`runnable` - An optional boolean flag which if truthy tells HCX is is OK to re-run scrips that are sub-elements of `el` each time the `el` is rendered.


## Templates and Remote Content
<a id="runnable-templates"></a>
Templates with encapsulated styles can be compiled and rendered at a later time with new model data. They can optionally be runnable by including the `runnable` flag at compile time and scripts in their definition.
And, an instruction can be provided to use the shadow DOM. By default it is true. It is shown here just for an example. You can actually compile any DOM element, but style and script management get a little tricky.

```html
<html>
	<head>
		<script type="module" src="../hcx.js"></script>
		<script>
			const loaded = () => {
				const el = document.getElementById("mytemplate"),
					compiled = hcx.compile(el,null,{runnable:true,shadow:true})();
				setTimeout(() => {
					compiled({message:"Hello World!",date:new Date()},document.getElementById("themessage"))
				})
			};
		</script>
		<template id="mytemplate">
			<style>
				div {
					font-size: 150%
				}
			</style>
			<script src="./mytemplate.js"></script>
			<div date="${date}">${message}</div>
			<script>console.log("mytemplate was rendered")</script>
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
			however, if loaded directly, the head will be used
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
		<script type="module" src="../hcx.js"></script>
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
		<script type="module" src="../hcx.js"></script>
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
    <script type="module" src="../hcx.js"></script>
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
		<script type="module" src="../hcx.js"></script>
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
		<script type="module" src="../hcx.js"></script>
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

Binding inputs associate sinput elements of type `<input>`, `<textarea>` and `<select>` with a model such that any time they are updated the model is updated. 
Compiled HTML is automatically bound and passing `bound:true` to `hcx.customElement` or wrapping a component in `hcx.bind` will also bind the inputs.

`hcx.bind(component,modelOrModelArgIndex=0,{inputs="*",imports,exports,reactive}={})`

`component` - An `HTMLElement` or a function returning one.

`modelOrModelArgIndex` - An object or a number representing the argument position of the `model` in the `component` function when called. Defaults to 0.

`inputs` - Defauls to `"*"` for all elements that can take input. It can also be an array on input ids to be more selective.

`imports` - Attributes to add to the model.

`exports` - Keys to export from the model and place on the rendered HTMLElement or update attributes.

`reactive` - Converts the model to a reactive one so that any changes automatically force a re-render of the component.

## Reactivity

Any HTML can be made reactive by passing in a reactor. By creating the reactor before calling compile it is available to other functions for updating.

```html
<html>
	<head>
		<script type="module" src="../hcx.js"></script>
		<script>
			const loaded = () => {
				const reactor = hcx.reactor({message:"Wait for it ...."});
				hcx.compile(document.body,reactor)();
				setTimeout(() => reactive.message="Hello World!",2000);
			}
		</script>
	</head>
	<body onload="loaded(event)">
		<div>${message}</div>
	</body>
</html>
```

## Adding Event Listeners

You can implement a reactive counter with an `on:click` attribute:

```html
<html>
	<head>
		<script type="module" src="../hcx.js"></script>
		<script>
			const loaded = () => {
				const reactor = hcx.reactor({count:0});
				hcx.compile(document.body,reactor)();
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
		<script type="module" src="../hcx.js"></script>
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
		<script type="module" src="../hcx.js"></script>
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

Finally, you can add event listeners to multiple HTML elements with a single call:

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

These will be registered as the respective event listeners for the event types on the component.

3) property functions named using the normal `on<fname>` approach, e.g. `onclick`:

```javascript
{
	onclick(event) { ... some code ...},
	onfocus(event) { ... some code ...}
}
```

These will be registered as the respective event listeners for the event types on the component.

4) arbitrary property functions, e.g.

```javascript
{
	myfunction(event) { ... some code ... }
}
```

These will replace attributes of the form `onclick="myfunction(event)"` on the component and any of its child elements.

## Attribute Directives

### h-foreach

If an element has an attribute `h-foreach` with a value that can be parsed as an array, e.g. [1,2,3] or ${(() => return [1,2,3])()}, then the
child elements will be repeated using each value in the array as a model of the form `{currentValue,index,array}`.

### h-forvalues

If an element has an attribute `h-forvalues` with a value that can be parsed as an object, e.g. {a:1,b:2,c:3} or ${(() => return {a:1,b:2,c:3})()}, then the
child elements will be repeated using each value in the array as a model of the form `{currentValue,index}`.

### h-forentries

If an element has an attribute `h-forentries` with a value that can be parsed as an object, e.g. {a:1,b:2,c:3} or ${(() => return {a:1,b:2,c:3})()}, then the
child elements will be repeated using each value in the array as a model of the form `{entry,index,entries}` where `entry` has the form `[key,value]`.

### h-forkeys

If an element has an attribute `h-forkeys` with a value that can be parsed as an object, e.g. {a:1,b:2,c:3} or ${(() => return {a:1,b:2,c:3})()}, then the
child elements will be repeated using each value in the array as a model of the form `{currentValue,index,array}` where `currentValue` is the current key
and `array` is the Array of keys.

### Custom Directives

Custom directives can be added using `hcx.directive(f,attributeName="h-"+f.name)` where `f` processes the directive. 

The value of `f` should be a function with the call signature `({node,model,name,value,extras})`. If `f` is anonymous, then the desired attribute name must be
provided when calling `hcx.directive`.

At rendering time,

1) `node` will be the currently rendering DOM node. Available on the node will be the property `originalChildren`, which will be the value of
`childNodes` the first time the DOM node was encountered.

2) `model` will be the current model. You can update the `model`, but if the attribute values are purely for rendering logic, you should add them
to `extras` instead.

3) `name` will be the name of the attribute.

4)  `value` will be the resolved value of the attribute. 

5) `extras` is at object you can safely add keys to for handling rendering logic.

Typically, 

1) The directive should handle all processing and not return a value. If the directive returns an object, then HCX will assume that child elements still need
to be processed. If the directive returns an object with the properties `before` or `after`, the functions stored on those properties will be called with the currently
processing node as both the first argument and the `this` context.

2) The directive only needs to call `await await hcx.render(child,model,undefined,false,Object.assign(extras,extra))`.

If the custom directive returns a Promise, it will be awaited.

`h-foreach` is implemented as a custom directive:

```javascript
async ({node,model,name,value,extras}) => {
	while(node.lastChild) {
		node.removeChild(node.lastChild); // remove all previous children
	}
	let index = 0;
	const array = value;
	for(let currentValue of array) {
		for(let child of node.originalChildren) {
			// make sure to clone and not use the original nodes
			child = child.cloneNode(true);
			// forevery, forkeys, etc are all converetd to foreach, so fake the model properties to be appropriate
			const extra = {currentValue,index,array,entry:currentValue,entries:array,value:currentValue}
			child = await hcx.render(child,model,undefined,false,Object.assign(extras,extra));
			node.appendChild(child);
		}
		index ++;
	}
}
```

### Custom Elements

There are two core custom elements `<hcx-include-element>` and `<hcx-router>`, but you can [add your own](#adding-custom-elements).

## Core Custom Elements

### hcx-include-element

Just include the module `hcx-include-element.js`, then put `<hcx-include-element for="<css selector>"></hcx-include-element>` in your document 
and the content of the element selected by `for` will be inserterd inside the tags.

### hcx-router

Include the module `hcx-router.html` and use any of the configurations below.

`<hcx-router [path="<string or RegExp>" [, target="<css selector>" [, to="<css selector for content>" [, runnable="true"]]]]>`

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

If the `path` attribute contains parameters, e.g. `user/:id`, or a query string, the parameters will be parsed and used as the data model
during the rendering process.

#### Route Content

If you specificy a CSS selector for the `to` attribute, the content of the first element matching the selector will be
used as the content of a shadow DOM in the target area. A shadow DOM is used so that if the source contains `<style>` elements,
they will not polute the rest of the document.

#### Remote Content

If the `to` attribute value does not result in the matching of an HTML element, an attempt is made to convert the value to a URL. 

If the `target` is an iframe, its source will be set to the URL and all parameters will be appended to the query string of the URL. 

Otherwise, an attempt to retrieve the file will be made. If the file can be retrieved and successfully parsed as HTML with a body, 
the body is used. If it is HTML without a body, then all the HTML is used. If the attribute `execute` is "true" and the remote 
body contains scripts, they will be executed in order. If they are dependent on scripts in a remote head, errors will be logged 
but not interrupt the flow for the rest of the scripts.

The use of remote content is ideal for micro-UI design. Each element of the UI can be designed and previewed in its own HTML file with its own styling.

#### Runnable Routes

If the content routed to contains scripts and `runnable="true"`, the scripts will be run. Except, if the target is an `<iframe>`, runnable does not have to be set.

#### Isolating Scripts

If the targetted content contains scripts and its is not a remote file, the script execution can be isolated by making the target be a CSS selector for iframes. Of course,
you also have to add teh iframes to your document.

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
	// event.preventDefault(); // call this if your event listener actually does the routing
	// selector = css selector or perhaps a path to get content based on route definition
	// targets = the DOM elements to update based on route definition
	... some logic, perhaps to retrieve remote content and then call hcx.render with targets
});

```

### Adding Custom Elements

Custom elements can be added using the function:

`hcx.customElement(tagName,component,{observed=[],callbacks={},properties={},extend={},defaultModel={},modelArgIndex=0,bound,listeners,reactiveObserved,shadow=true}={})`

`tagName` - Per industry standard must include at least one `-`. Can be mixed case to support camel casing the component class that is created, e.g.
`HCX-include` creates a class called `HCXInclude`. However, per industry standard the actual HTML tag will be single case, e.g. `hcx-include`.

`component` - A string, or HTML Element, or function returning an HTML Element to use for the definition. It can also be `null` or `undefined`, in which
case a container element is created such that all inner HTML is preserved at rendering time. This allows the use of custom elements for purely
stylistic and UI funcation purposes. See `examples/container.html`.

`observed` - Attributes to be observed per [industry standard for the `attributeChangedCallback`](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks).

`callbacks` - Industry standard callbacks without the suffix `Callback`, e.g.

```javascript
{
	connected() { ... },
	disconnected() { ... },
	adopted() { ... },
	attributeChanged() { ... }
}
```

Default handlers are provided, so you do not have to create all of them.

`properties` - Any additional data or functional properties to add to the prototype for the generated element

`extend` - TO BE WRITTEN

`defaultModel` - The default model to use for the customElement. This allows partial models to be provided at rendering time.

`modelArgIndex` - The inded of the 'model` in the arguments to `component` at runtime.

`bound` - Set to `true` if the rendered element should automatically bind `model` properties to inputs.

`listeners` - Event listeners. See [addEventListeners](#adding-event-listeners).

`reactiveObservered` - Set to `true` if you want to automatically re-render anytime an observed attribute changes. You can still provide an 
`attributeChanged` callback and rendering whill be done when it returns.

`shadow` - Use the shadow DOM for the child content. Defaults to `true`.

# Notes

There has been limited testing or focus on optimization.

# Release History (Reverse Chronological Order)

2020-02-02 v0.0.14 BETA - Removed need to prefix event handler names with `hcx` as well as need for them to take an Event as first argument. Improved remote script handling.

2020-02-01 v0.0.13 BETA - Documentation updates. Support for `<iframe>` as target for `<hcx-router>`. 

2020-02-01 v0.0.12 BETA - Documentation updates.

2020-02-01 v0.0.11 BETA - Modified tag line. Documentation updates.

2020-01-31 v0.0.10 BETA - Specialized :$to route parameter.

2020-01-31 v0.0.10 BETA - Fixed issue with remote scripts not getting attributes.

2020-01-31 v0.0.9 BETA - Runnable templates support the same as executable route destinations added.

2020-01-30 v0.0.8 BETA - Feature complete. 98% documentation complete.

2020-01-28 v0.0.7 ALPHA - Micro-UI design support. `addEventListeners` improvements.

2020-01-28 v0.0.6 ALPHA - Documentation updates. Remote and parameterized routes added.

2020-01-27 v0.0.5 ALPHA - Documentation updates

2020-01-27 v0.0.4 ALPHA - Documentation updates

2020-01-27 v0.0.3 ALPHA - Added routeless router and model exports upon creation

2020-01-27 v0.0.2 ALPHA - Added `<hcx-include-element>` and `<hcx-router>`. Various bug fixes.

2020-01-24 v0.0.01 ALPHA - Initial release
