# HCX

HTML compilation and component utility functions for a framework free or framework light UI.

Core Libaray: 20.1K raw

	1) ES 2017 - 20.1K raw, 11.8K terser compress, 4k gzip
	2) ES 2015 - 36.7K raw, 15.7K terser compress, 5k gzip


# What

HTML Compiler eXtensions (HCX) flips JSX on its head. Rather than make JavaScript handle HTML, HCX makes HTML handle JavaScript more directly.

HCX extends JavaScript template notation, i.e. `${ ... javascript }`, into HTML itself.

HCX provides utility functions you can wrap around existing components or plain old HTMLElement DOM nodes to bind forms to models and
event handlers to anything you can select via CSS.

HCX generally eliminates the need for control flow attribute directives. However, `h-foreach`, `h-forvalues`, `h-forentries`, `h-forkeys` are directly supported
and custom directives can be added.

HCX compeletely eliminates the need for content replacement directives like VUE's `v-text`. You just reference reactive data directly in your HTML, e.g.
instead of `<div v-text="message"></div>` just use `<div>${message}</div>`. This also means that the VUE filter syntax is un-neccesary, e.g.
instead of `<span v-text="message | capitalize"></span>` use `<span>${message.toUpperCase()}</span>` or even the new JavaScript pipe operator when it becomes
available `<span>${message |> capitalize}</span>`.

HCX supports industry standard Custom HTML Elements. In fact, you can turn any HTMLElement DOM node into a Custom HTML Element.

HCX includes two custom elements: `<hcx-include-element>` and `<hcx-router>`. The router can target any DOM node as a destination and sources its content from
any other DOM node as well as use a RegExp for pattern matching routes. There can be multiple routers on the same page. In fact, multiple routers
can respond to the same `haschange` events. You can even have a routeless router, <hcx-router></hcx-router>, which will replace its own content with
that of DOM nodes having an id that matches the current location hash for a document.

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

If you don't want to copy files out of `node_modules/hcx` and are using Express, try `modulastic` to expose the hcx files directly.

See the `examples/index.hml` file to see how to use specific functions. More documentation coming ...

# Notes

There has been limited testing or focus on optimization.

# Release History (Reverse Chronological Order)

2020-01-27 v0.0.04 ALPHA - Documentation updates

2020-01-27 v0.0.03 ALPHA - Added routeless router and model exports upon creation

2020-01-27 v0.0.02 ALPHA - Added `<hcx-include-element>` and `<hcx-router>`. Various bug fixes.

2020-01-24 v0.0.01 ALPHA - Initial release
