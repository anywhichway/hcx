export const hcx = async function(strings,...args) {
	for(let i=0;i<args.length;i++) {
		args[i] = await args[i];
	}
	return hcxSync(strings,...args);
}
if(typeof(window)!=="undefined") {
	window.hcx = hcx;
}
export default hcx;


const parser = new DOMParser(),
AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

const DIRECTIVES = {
		"h-foreach": async ({node,model,name,value,extras}) => {
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
		},
		"h-transition": ({node,value,extras}) => {
			const before = node[value.before]||extras[value.before],
				after = node[value.after]||extras[value.after];
			return {before:before ? before.bind(node) : undefined,after: after ? after.bind(node) : undefined};
		}
}

const asDOM = hcx.asDOM = (value) => {
	let node = parser.parseFromString(value,"text/xml"); // allows parsing of invalid hmtl sub-fragments like <tbody> without <table>
	const err = node.querySelector("parsererror");
	if(err) {
		//console.warn(err.innerText,value);
		node = parser.parseFromString(value,"text/html");
	} else {
		node = XMLtoHTML(node);
	}
	node.normalize();
	return node.childNodes.length>1 ? node : node.firstChild;
}

function hcxSync(strings,...args) {
	if(args.some((arg) => arg && typeof(arg)==="object" && arg instanceof Node)) {
		args = args.map((arg) => arg && typeof(arg)==="object" && arg instanceof Node ? arg : new Text(arg+""))
		return args.length>1 ? args : args[0]; // template processing returned DOM nodes
		//return args;
	} 
	const value = strings.reduce((accum,str,i) => i<args.length ? accum += str + (args[i]===undefined ? "" : stringifyObjects(args[i])) : accum += str,"").trim();
	if(value.startsWith("<") && value.endsWith(">")) {
		return asDOM(value);
	}
	return new Text(value);
}

function stringifyObjects(value) {
	if(value && typeof(value)==="object") {
		return JSON.stringify(value);
	}
	return value;
}

async function resolve({node,text,model,extras,hcx}) {
	try {
		return await Function("hcx","model","extras","with(model) { with(extras) { return hcx`" + text + "` } }")(hcx,model,extras);
	} catch(e) {
		if(e instanceof ReferenceError) {
			let name = e.message.trim().split(" ")[0].replace(/['"]/g,""),
			value = "";
			const el = node && node instanceof Text ? node.parentElement : node;
			if(el && el.hasAttribute && el.hasAttribute(name)) {
				value = el.getAttribute(name);
				if(value.includes("${")) {
					value = (await resolve({node,text:value,model,extras,hcx})).wholeText;
				}
				try {
					value = JSON.parse(value);
				} catch(e) {
					;
				}
			}
			extras[name] = value;
			return resolve({node,text,model,extras,hcx});
		}
		throw e;
	}
}

const XMLtoHTML = (node) => {
	if(node.nodeType===1) {
		const html = node.innerHTML,
		attributes = [].slice.call(node.attributes),
		el = document.createElement(node.tagName);
		attributes.forEach((attribute) => {
			el.setAttribute(attribute.name,attribute.value);
		});
		for(const child of node.childNodes) {
			el.appendChild(XMLtoHTML(child))
		}
		return el;
	}
	if(node.nodeType===3) {
		return new Text(node.data);
	}
	if(node.nodeType===9) {
		const fragment = new DocumentFragment();
		for(const child of node.childNodes) {
			fragment.appendChild(XMLtoHTML(child))
		}
		return fragment;
	}
	return node.cloneNode(true);
}

const getModelValue = (model,property) => {
	let currentValue = model,
		key;
	const keys = property.split(".");
	while(model && typeof(model)==="object" && keys.length>0) {
		key = keys.shift();
		model = model[key];
	}
	if(keys.length===0) {
		return currentValue;
	}
}

const setModelValue = (model,property,value) => {
	let currentValue = model,
		_model = model,
		key;
	const keys = property.split(".");
	while(currentValue && typeof(currentValue)==="object" && keys.length>0) {
		_model = currentValue;
		key = keys.shift();
		currentValue = currentValue[key];
	}
	if(keys.length===0) {
		try {
			value = JSON.parse(value);
		} catch(e) {
			;
		}
		if(currentValue!==value) {
			_model[key] = value;
		}
	}
}

const directive = hcx.directive = (f,attributeName="h-"+f.name) => {
	if(attributeName.startsWith("f-")) {
		DIRECTIVES[attributeName] = f;
		return;
	}
	throw new Error(`directive attributeName must start with 'h-': ${attributeName}`)
}

const render = hcx.render = async (node,model,target,shadow,extras={}) => {
	node = await node;
	model = model ? await model : model={};
	if(model.hcxIsModel) {
		model.hcxElement = node;
	}
	if(!node || typeof(node)!=="object" || !(node instanceof Node)) {
		throw new TypeError("hcx.render expects a DOM Node as the first argument")
	}
	if(target) {
		const html = node.tagName==="TEMPLATE" ? node.innerHTML : node.outerHTML,
		body = parser.parseFromString(`<body>${html}</body>`,"text/html").body;
		body.normalize();
		let count  = 0,
			attributes;
		if(node.tagName==="TEMPLATE") {
			const el = body.firstElementChild;
			if(el) {
				attributes = [].slice.call(el.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum;},{});
			}
		} else {
			attributes = [].slice.call(node.attributes).reduce((accum,attribute) => { accum[attribute.name] = attribute.value; return accum;},{});
		}
		const max = target.childNodes.length;
		if(shadow) {
			while(target.lastChild) {
				target.removeChild(target.lastChild);
			}
			if(!target.shadowRoot) {
				target.attachShadow({mode: 'open'});
			}
			target = target.shadowRoot;
		}
		while(target.firstChild && body.firstChild) {
			count++;
			target.firstChild.replacementNode = body.firstChild;
			target.replaceChild(body.firstChild,target.firstChild)
		}
		while(count<max && target.lastChild) {
			count++;
			target.removeChild(target.lastChild);
		}
		while(body.firstChild) {
			target.appendChild(body.firstChild)
		}
		if(target.attributes) {
			Object.keys(attributes).forEach((key) => {
				if(key!=="id" && !target.attributes[key]) {
					target.setAttribute(key,attributes[key]);
				}
			})
		}
		node = target;
	}
	const directives = [];
	let directiveresults;
	if(node.tagName!=="SCRIPT") {
		node.normalize();
		document.renderingNode = node;
		if(node.attributes) {
			const anames = Object.keys(Object.getOwnPropertyDescriptors(node.attributes)).filter((key) => isNaN(parseInt(key))); // lets us use technically invalid attribute names like :$<somename>
			let i = 0;
			const attributes = anames.map((key) => node.attributes[key]);
			for(const attribute of attributes) {
				let name = attribute.name[0]===":" ? anames[i] : attribute.name;
				i++;
				if(name.startsWith("on")) {
					const parts = name.split(":"),
					eventname = parts.length===2 ? parts[1] : name.substring(2),
							value = attribute.value;
					if(value.includes("${") && value.includes("}")) {
						node.hcxListeners || (node.hcxListeners = new Set());
						if(!node.hcxListeners.has(value)) {
							node.hcxListeners.add(value);
							node.addEventListener(eventname,async (event) => {
								document.renderingNode = node;
								const newvalue = await resolve({node,text:value,model,extras,hcx});
								document.renderingNode = null;
								node.setAttribute(attribute.name,newvalue.wholeText);
								if(typeof(node[name])==="function") {
									node[name](event);
								}
							});
						}
					}
				} else if(attribute.originalContent || attribute.value.includes("${") || /\{.*\}/g.test(attribute.value) || /\[.*\]/g.test(attribute.value)) {
					attribute.originalContent || (attribute.originalContent = attribute.value);
					let value = (await resolve({node,text:attribute.originalContent,model,extras,hcx}));
					value = value instanceof Text ? value.wholeText.trim() : value.innerHTML;
					try {
						value = JSON.parse(value);
					} catch(e) {
						;
					}
					if(name.startsWith(":")) {
						name = name.substring(1);
						if(name[0]==="$") {
							name = name.substring(1);
							if(value!=="") {
								node.setAttribute(name,value);
							}
						} else if(value) {
							node.setAttribute(name,"");
						} else {
							node.removeAttribute(name);
						}
					} else if(value!==null && typeof(value)!=="object"){
						attribute.value = value;
					}
					if(name.startsWith("h-")) {
						if(name==="h-forvalues") {
							name = "h-foreach";
							value = Object.values(value);
						} else if(name==="h-forentries") {
							name = "h-foreach";
							value = Object.entries(value);
						} else if(name==="h-forkeys") {
							name = "h-foreach";
							value = Object.keys(value);
						}
						const directive = DIRECTIVES[name];
						if(directive) {
							node.originalChildren || (node.originalChildren = [].slice.call(node.childNodes));
							directives.push(directive.bind(null,{node,model,name,value,extras}))
						}
					}
				}
			}
			for(const directive of directives.slice()) {
				const result = await directive();
				if(result && typeof(result)==="object" && !Array.isArray(result)) {
					directiveresults || (directiveresults=[]);
					directiveresults.push(result);
				}
			}
		}
		if(node instanceof Text) {
			if(node.wholeText.includes("${")) {
				node.originalContent = node.wholeText;
			}
			if(model.hcxIsModel) {
				model.hcxElement = node.parentElement;
			}
			let value = node;
			if(node.originalContent && node.originalContent.includes("${")) {
				value = await resolve({node,text:node.originalContent,model,extras,hcx}); 
			}
			if(value!==node) {
				value.originalContent = node.originalContent;
				value.expandsInstruction = node.expandsInstruction;
				if(value instanceof Text) {
					node.data = value.wholeText;
				} else {
					node.parentNode.replaceChild(value,node);
					node.replacementNode = value;
				}
			}
		} else if((node.nodeType===7 || node.nodeType===8) && /[\s\?]?hcx\s.*/.test(node.textContent)) { // if <!--hcx then patch it in after resolution
			const end = node.nodeType===7 ? node.textContent.length-1 : (node.textContent.endsWith("?") ? node.textContent.length-1 : node.textContent.length),
					start = node.textContent.indexOf("hcx") + 4,
					text = node.textContent.substring(start,end).trim(),
					value = await resolve({node,text,model,extras,hcx});
			node.instructionId || (node.instructionId=Math.random())
			for(const child of [].slice.call(node.parentNode.childNodes)) {
				if(child.expandsInstruction===node.instructionId) {
					node.parentNode.removeChild(child)
				}
			}
			if(Array.isArray(value)) {
				value.forEach((item) => {
					item.expandsInstruction = node.instructionId;
					node.parentElement.insertBefore(item,node);
				})
			} else {
				value.expandsInstruction = node.instructionId;
				node.parentElement.insertBefore(value,node);
			}
		} else if((!directiveresults || directiveresults.length>0) && node.childNodes) {
			if(node.originalContent) {
				const value = await resolve({node,text:node.originalContent,model,extras,hcx});
				value.originalContent = node.originalContent;
				value.expandsInstruction = node.expandsInstruction;
				node.parentElement.replaceChild(value,node);
				node.replacementNode = value;
			} else {
				if(directiveresults) {
					directiveresults.forEach((directive) => {
						if(directive.before) {
							directive.before(node)
						}
					})	
				}
				for(const child of node.childNodes) {
					await render(child,model,undefined,false,extras);
				}
				if(directiveresults) {
					directiveresults.forEach((directive) => {
						if(directive.after) {
							directive.after(node)
						}
					})
				}
				document.renderingNode = node;
			}
		}
		document.renderingNode = null;
	}
	return node;
}

const compile = hcx.compile = (el,model,{imports,exports,reactive,listeners,properties,shadow=true,runnable}={}) => {
	if(el && typeof(el)==="object" && el instanceof HTMLElement) {
		const f = async (el,_model,target,_shadow) => {
			if(_shadow===undefined) {
				_shadow = shadow;
			}
			if(!_model) {
				_model = model;
			}
			if((imports && imports.length>0) || (exports && exports.length>0) || reactive) {
				_model = createModel(_model,{imports,exports,reactive})
			}
			return new Promise((resolve,reject) => {
				requestAnimationFrame(async () => {
					const node = await render(el,_model,target,_shadow,Object.assign({},properties));
					if(listeners) {
						addEventListeners(node,listeners);
					}
					if(properties) {
						hcx.properties(node,properties);
					}
					bind(node,_model);
					const scripts = node.querySelectorAll("script")||[];
					for(const script of scripts) {
						const type = script.getAttribute("type")||"text/javascript",
							src = script.getAttribute("src");
						if(src) {
							const child = document.createElement("script");
							for(const attribute of script.attributes) {
								child.setAttribute(attribute.name,attribute.value);
							}
							script.parentNode.replaceChild(child,script);
						} else if(type.includes("javascript")) {
							try {
								Function(script.innerText)();
							} catch(e) {
								console.error(e)
							}
						}
					}
					resolve(node);
				})
			})
		}
		return f.bind(null,el)
	}
	throw new TypeError("first argument to hcx.compile must be HTMLElement");
}

const addEventListenersAux = (el,listeners,recursing) => {
	const attributes = [].slice.call(el.attributes||[]);
	Object.keys(listeners).forEach((key) => {
		const handler = listeners[key],
		type = typeof(handler);
		if(!recursing && handler && type==="object") {
			if(key.startsWith("on")) {
				Object.keys(handler).forEach((event) => {
					el.addEventListener(event,handler[event]);
				})
			} else {
				// add handlers to elements matching key as CSS
				for(const child of el.querySelectorAll(key)) {
					Object.keys(handler).forEach((event) => {
						child.addEventListener(event,handler[event]);
					})
				}
			}
		} else if(!recursing && type==="function" && key.startsWith("on")) {
			const ename = key.substring(2);
			el.addEventListener(ename,handler);
		} else {
			for(const attribute of attributes) {
				const handler = attribute.value.trim();
				if(attribute.name.startsWith("on")  && handler.startsWith(`${key}(`)) {
					const ename = attribute.name.startsWith("on:") ? attribute.name.substring(3) : attribute.name.substring(2);
					if(!attribute.name.startsWith("on:")) {
						el.removeAttribute(attribute.name);
					}
					el.addEventListener(ename,(event) => {
						Function("event","listeners",`listeners.${handler}`).call(event.currentTarget,event,listeners);
					})
				}
			}
		}
	})
	for(const child of el.children) {
		addEventListenersAux(child,listeners,true);
	}
	return el;
}
const addEventListeners = hcx.addEventListeners = (component,listeners={}) => {
	const type = typeof(component);
	if(type==="function") {
		return async (...args)  => {
			const el = await component(...args),
			type = typeof(el);
			if(el && typeof(el)==="object" && el instanceof HTMLElement) {
				return addEventListenersAux(el,listeners);
			}
			throw new TypeError("component function must return an HTMLElement for hcx.addEventListeners");
		}
	}
	if(component && type==="object" && (component instanceof HTMLElement || component instanceof DocumentFragment)) {
		return addEventListenersAux(component,listeners);
	}
	throw new TypeError("First argument to hcx.addEventListeners must be a function or HTMLElement");
}

const propertiesAux = (el,properties) => {
	return Object.assign(el,properties);
}
const properties = hcx.properties = (component,properties={}) => {
	const type = typeof(component);
	if(type==="function") {
		return async (...args)  => {
			const el = await component(...args),
			type = typeof(el);
			if(el && typeof(el)==="object" && el instanceof HTMLElement) {
				return propertiesAux(el,properties);
			}
			throw new TypeError("component function must return an HTMLElement for hcx.properties");
		}
	}
	if(component && type==="object" && component instanceof HTMLElement) {
		return propertiesAux(component,properties);
	}
	throw new TypeError("First argument to hcx.properties must be a function or HTMLElement");
}

const DEPENDENTS = new Map();

const makeReactorProxy = (data,parent={}) => {
	if(!data || typeof(data)!=="object" || data.hcxIsReactor) {
		return data;
	}
	let dependents = DEPENDENTS.get(data);
	if(!dependents) {
		DEPENDENTS.set(data,dependents = new Map());
	}
	const rendering = document.renderingNode;
	document.renderingNode = null;
	const pseudoObject = Object.keys(data).concat(Object.keys(parent)).reduce((accum,key) => { const value = data[key]; accum[key] = value!=null ? value : parent[key]; return accum;},{});
	document.renderingNode = rendering;
	const proxy = new Proxy(pseudoObject,{
		get(_,property) {
			if(property==="hcxIsReactor") {
				return true;
			}
			let value = data[property];
			const _node = document.renderingNode;
			if(_node && typeof(property)!=="symbol" && property!=="then") {
				if(value==null && parent) {
					value = parent[property];
				}
				if(value && typeof(value)==="object") {
					value = makeReactorProxy(value,proxy);
					if(value.hcxIsModel) {
						value.hcxElement = _node;
					}
				}
				let map = dependents.get(property);
				if(!map) {
					dependents.set(property,map = new Map())
				}
				map.set(_node,proxy);
			}
			return value;
		},
		set(_,property,value) {
			if(data[property]!==value) {
				if(value===undefined) {
					delete data[property];
				} else {
					data[property] = value;
				}
				const map = dependents.get(property);
				if(map) {
					for(const node of Array.from(map.keys())) {
						const _node = node.replacementNode || node;
						if(!_node.isConnected) {
							map.delete(node);
							if(map.size===0) {
								dependents.delete(property);
							}
						} else {
							const proxy = map.get(node);
							if(node.replacementNode) {
								map.delete(node);
								map.set(node.replacementNode,proxy);
							}
							if(_node.render) {
								_node.render(proxy);
							} else {
								render(_node,proxy);
							}
						}
					}
				}
			}
			return true;
		}
	});
	return proxy;
}

const reactor = hcx.reactor = (data) => {
	return makeReactorProxy(data);
}

const bindAux = (el,model) => {
	if(model && typeof(model)==="object") {
		const inputs = el.querySelectorAll("input, select, textarea");
		for(const input of inputs) {
			const property = input.getAttribute("bind");
			if(property) {
				input.addEventListener("change",(event) => {
					document.renderingNode = input;
					setModelValue(model,property,event.target.value);
				})
			}
		}
	}
	return el;
}

const bind = hcx.bind = (component,modelOrModelArgIndex=0) => {
	const type = typeof(component);
	if(type==="function") {
		return async (...args) => {
			for(let i=0;i<args.length;i++) {
				args[i] = await args[i];
			}
			let _model = typeof(modelOrModelArgIndex)==="number" ? args[modelOrModelArgIndex] : modelOrModelArgIndex;
			if(typeof(modelOrModelArgIndex)==="number") {
				args[modelOrModelArgIndex] = _model;
			}
			const el = await component(...args);
			if(el && typeof(el)==="object" && (el instanceof HTMLElement || el instanceof DocumentFragment)) {
				return bindAux(el,_model);
			}
			throw new TypeError("component function must return an HTMLElement for bind");
		}
	}
	if(component && type==="object" && (component instanceof HTMLElement || component instanceof DocumentFragment)) {
		return bindAux(component,modelOrModelArgIndex)
	}
	throw new TypeError("First argument to hcx.bind must be a function or HTMLElement");
}

const customElement = hcx.customElement = (tagName,component,{observed=[],callbacks={},properties={},extend={},defaultModel={},modelArgIndex=0,bound,listeners,reactiveObserved,shadow=true}={}) => {
	const type=typeof(component),
	cls = extend.class || HTMLElement,
	cname = tagName.split("-").map((part) => part[0].toUpperCase()+part.substring(1)).join(""),
	getObservedAttributes = () => {
		return observed.slice(0);
	},
	_customElement = Function("getObservedAttributes",`return class ${cname} extends ${cls.name} { constructor(model,options) { super(); this.construct(model,options) }  static get observedAttributes() { return getObservedAttributes(); }}`)(getObservedAttributes);
	if(type==="string") {
		const _component = parser.parseFromString(`<body>${component}</body>`,"text/html").body.firstElementChild;
		component = () => _component;
	} else if(component && type==="object" && component instanceof HTMLElement) {
		const _component = component;
		component = () => _component;
	}
	if(component && typeof(component)!=="function") {
		throw new TypeError("Second argument to hcx.customElement must be a function or HTMLElement");
	}
	_customElement.component = component;
	Object.assign(_customElement.prototype,properties);
	_customElement.prototype.construct = function(model={},options={}) {
		const el = this,
		_component = _customElement.component;
		let component = _component,
		_model = model;
		component = (...args) => {
			let model = args[modelArgIndex];
			_model = model||_model;
			model = createModel(model||_model,{imports:observed,exports:observed},defaultModel);
			args[modelArgIndex] = model;
			if(_component && shadow && !this.shadowRoot) {
				this.attachShadow({mode: 'open'});
			}
			return render(_component ? _component(...args) : this,model,_component ? this.shadowRoot : undefined);
		}
		if(bound) {
			component = bind(component,modelArgIndex);
		}
		if(listeners) {
			component = addEventListeners(component,listeners);
		}
		Object.defineProperty(this,"render",{configurable:true,value:(...args)=>component(...args)});
	}
	_customElement.prototype.adoptedCallback = async function() {
		if(callbacks.adopted) {
			await callbacks.adopted.call(this);
		}
	};
	_customElement.prototype.attributeChangedCallback = async function(name,oldValue,newValue) {
		if(callbacks.attributeChanged) {
			await callbacks.attributeChanged.call(this,name,oldValue,newValue);
		}
		if(reactiveObserved===true) {
			this.render();
		}
	};
	_customElement.prototype.connectedCallback = async function() {
		if(callbacks.connected) {
			await callbacks.connected.call(this);
		}
		this.render();
	};
	_customElement.prototype.disconnectedCallback = async function() {
		if(callbacks.disconnected) {
			await callbacks.disconnected.call(this);
		}
	};
	_customElement.prototype.observedAttributes = getObservedAttributes;
	_customElement.define = function() {
		const name = tagName.toLowerCase();
		if(!customElements.get(name)) {
			customElements.define(name,this,extend.tagName ? {extends:extend.tagName} : undefined);
		}
	};
	return _customElement;
}

const createModel = hcx.model = (object={},{imports=[],exports=[],reactive}={},defaultModel) => { // defaultModel is used only by customElements;
	let el;
	const rendering = document.renderingNode;
	document.renderingNode = null;
	const pseudoObject = Object.keys(object).concat(imports,exports).reduce((accum,key) => { accum[key] = undefined; return accum; },{}),
	proxy = new Proxy(pseudoObject,{
		get(_,property) {
			if(property==="hcxIsModel") {
				return true;
			}
			let value = object[property];
			if(value==null && typeof(property)==="string" && el && el.getAttribute && imports.includes(property)) {
				value = el.getAttribute(property);
				if(value && value.includes("${")) {
					value = resolve({node:el,text:value,model:proxy,extras:{},hcx:hcxSync});
				}
				try {
					value = JSON.parse(value);
				} catch(e) {
					;
				}
				if(exports.includes(property)) {
					el[property] = value;
				}
			}
			if(defaultModel && (value==null || value==="")) {
				value = defaultModel[property];
			}
			return value;
		},
		set(_,property,value) {
			if(property==="hcxElement") {
				el = value;
				if(el && el.attributes) {
					for(const attribute of el.attributes) {
						if(!attribute.name.startsWith("on") && object[attribute.name]===undefined) {
							const doimport = imports.includes(attribute.name),
							doexport = exports.includes(attribute.name);
							if(doimport || doexport) {
								let value = attribute.value;
								if(value && value.includes("${")) {
									value = resolve({node:el,text:value,model:proxy,extras:{},hcx:hcxSync});
								}
								try {
									value = JSON.parse(value);
								} catch(e) {
									;
								}
								if(doimport) {
									object[attribute.name] = value;
								}
								if(doexport) {
									el[attribute.name] = value;
								}
							}
						}
					}
					Object.keys(object).forEach((key) => {
						if(exports.includes(key) && !el.attributes[key]) {
							const value = object[key];
							if(!value || (typeof(value)!=="object" && typeof(value)!=="function")) {
								sel.setAttribute(key,value)
							}
						}
					});
				}
			} else {
				object[property] = value;
				if(el && el.attributes) {
					if(exports.includes(property)) {
						if(!value || typeof(value)!=="object") {
							el.setAttribute(property,value);
						} else {
							try {
								el.setAttribute(property,JSON.stringify(value));
							} catch(e) {
								;
							}
						}
						el[property] = value;
					}
				}
			}
			return true;
		}
	});
	return reactive ? reactor(proxy) : proxy;
}