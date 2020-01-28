import {hcx} from "./index.js";

const recompile = async (target,source,model) => {
	const div = document.createElement("div");
	div.innerHTML = source.innerHTML;
	source = await hcx.compile(div,model)();
	while(target.lastChild) {
		target.removeChild(target.lastChild);
	}
	while(source.lastChild) {
		target.appendChild(source.lastChild);
	}
}

const createRouter = (hcxRouter) => {
	const target = hcxRouter.attributes.target ? hcxRouter.attributes.target.value : hcxRouter,
			path = hcxRouter.attributes.path ? hcxRouter.attributes.path.value : null;
		const elements = target===hcxRouter ? [hcxRouter] : document.querySelectorAll(target);
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
						revent = new Event("route");
					Object.assign(revent,{selector,targets:[].slice.call(elements)});
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
							(async () => {
								try {
									const href = new URL(selector,document.baseURI).href,
										file = await fetch(href),
										text = await file.text();
									source = hcx.asDOM(text);
								} catch(e) {
									console.warn(`valid source ${location.hash} is not available for route`);
									return;
								}
								if(source) {
									for(const target of elements) {
										recompile(target,source,model);
									}
								} else {
									console.warn(`valid source ${location.hash} is not available for route`)
								}
							})()
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
	callbacks:{
		connected() {
			createRouter(this);
		},
		attributeChanged() {
			createRouter(this);
		}
	},
	observedReactive:true});
HCXRouter.define();

export default HCXRouter;
export {HCXRouter};