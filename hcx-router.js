import {hcx} from "./index.js";

const recompile = async (target,source,model,execute) => {
	const div = document.createElement("div");
	div.innerHTML = source.innerHTML;
	source = await hcx.compile(div,model)();
	while(target.lastChild) {
		target.removeChild(target.lastChild);
	}
	if(!target.shadowRoot) {
		target.attachShadow({mode: 'open'});
	}
	target = target.shadowRoot;
	if(target.innerHTML!==source.innerHTML) {
		while(target.lastChild) {
			target.removeChild(target.lastChild);
		}
		while(source.firstChild) {
			target.appendChild(source.firstChild);
		}
		if(execute) {
			const scripts = target.querySelectorAll("script")||[];
			for(const script of scripts) {
				const type = script.getAttribute("type")||"text/javascript",
					src = script.getAttribute("src");
				if(src) {
					const child = document.createElement("script");
					child.setAttribute("type",type);
					child.setAttribute("src",src);
					script.parentNode.replaceChild(child,script);
				} else if(type.includes("javascript")) {
					try {
						Function(script.innerText)();
					} catch(e) {
						console.error(e)
					}
				}
			}
		}
	}
}

function createRouter() {
	const hcxRouter = this,
		target = hcxRouter.attributes.target ? hcxRouter.attributes.target.value : hcxRouter,
		path = hcxRouter.attributes.path ? hcxRouter.attributes.path.value : null,
		elements = target===hcxRouter ? [hcxRouter] : document.querySelectorAll(target);
	if(hcxRouter.router) {
		window.removeEventListener("hashchange",hcxRouter.router);
	}
	if(elements.length>0) {
		const router = (event) => {
			let isregexp,
				matched, 
				model, 
				hash = location.hash.substring(1);
			if(path && path[0]==="/") {
				try {
					const regexp = Function("return " + path)();
					if(regexp instanceof RegExp) {
						isregexp = true;
						matched = regexp.test(hash);
					}
				} catch(e) {
					;
				}
			}
			if(path && !isregexp) {
				const pathparts = path.split("/"),
					fakeurl = new URL(hash,document.baseURI),
					rootparts = document.location.pathname.split("/"),
					hashparts = fakeurl.pathname.substring(rootparts.slice(0,rootparts.length-1).join("/").length+1).split("/");
				let pathpart = pathparts.shift(),
					hashpart = hashparts.shift();
				do {
					matched = false;
					if(pathpart===hashpart) {
						pathpart = pathparts.shift();
						hashpart = hashparts.shift();
						matched = true;
					} else if(pathpart[0]===":") {
						model || (model = {});
						let value = hashpart;
						try {
							value = JSON.parse(value);
						} catch(e) {
							;
						}
						model[pathpart.substring(1)] = value;
						pathpart = pathparts.shift();
						hashpart = hashparts.shift();
						matched = true;
					}
					if(!matched) {
						break;
					}
				} while(pathpart && hashpart);
				matched = matched && pathparts.length===0 && hashparts.length===0;
				if(fakeurl.search.length>1) {
					const parts = fakeurl.search.substring(1).split("&");
					if(parts.length>0) {
						model || (model = {});
						parts.forEach((part) => {
							let [key,value] = part.split("=");
							if(value===undefined) {
								value = true;
							}
							value = decodeURIComponent(value);
							try {
								value = JSON.parse(value);
							} catch(e) {
								
							}
							model[key] = value;
						})
					}
				}
			}
			if(!path || matched) {
				const defaultselector = location.hash.includes("?") ? location.hash.substring(0,location.hash.indexOf("?")) : location.hash,
					selector = hcxRouter.attributes.to ? hcxRouter.attributes.to.value : defaultselector,
					execute = hcxRouter.getAttribute("execute"),
					revent = new Event("route"),
					targets = [].slice.call(elements);
				Object.assign(revent,{selector,targets});
				hcxRouter.dispatchEvent(revent);
				if(!revent.defaultPrevented) {
					let source;
					try {
						source = selector ? document.querySelector(selector) : null;
						if(source) {
							for(const target of elements) {
								recompile(target,source,model);
							}
						}
						return;
					} catch(e) {
						;
					}
					if(!source && selector[0]!=="#") {
						try {
							const href = new URL(selector,document.baseURI).href;
							(async () => {
								try {
									const file = await fetch(href),
										text = await file.text(),
										dom = hcx.asDOM(text),
										body = dom.querySelector("body"),
										head = dom.querySelector("head");
								source = body ? body : (!head ? dom : null);	
								} catch(e) {
									console.warn(`valid source ${location.hash} is not available for route`);
									return;
								}
								if(source) {
									for(const target of targets) {
										recompile(target,source,model,execute==="true");
									}
								} else {
									console.warn(`valid source ${location.hash} is not available for route`)
								}
							})()
						} catch(e) {
							console.warn(`valid source ${location.hash} is not available for route`);
						}
					}
				}
			}
		}
		window.addEventListener("hashchange",router);
		hcxRouter.router = router;
		router();
	} else {
		console.warn(`Route target elements matching ${target} are missing. Hash changes will have default browser behavior.`)
	}
}

const HCXRouter = hcx.customElement("HCX-router","<div></div>",{
	shadow:false,
	observed: ["path","target","for"],
	properties: {
		createRouter
	},
	callbacks:{
		connected() {
			this.createRouter();
		},
		attributeChanged() {
			this.createRouter();
		}
	},
	observedReactive:true});
HCXRouter.define();

export default HCXRouter;
export {HCXRouter};