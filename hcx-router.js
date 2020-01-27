import {hcx} from "./index.js";

const recompile = async (target,source) => {
	const div = document.createElement("div");
	div.innerHTML = source.innerHTML;
	source = await hcx.compile(div)();
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
				if(!path || new RegExp(path).test(location.hash.substring(1))) {
					const selector = hcxRouter.attributes.to ? hcxRouter.attributes.to.value : location.hash,
							source = selector ? document.querySelector(selector) : null;
					if(source) {
						for(const target of elements) {
							recompile(target,source);
						}
					} else {
						console.warn(`source ${location.hash} is not available for route`)
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