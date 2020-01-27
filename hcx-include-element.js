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

const HCXIncludeElement = hcx.customElement("HCX-include-element","<div></div>",{
	shadow:false,
	observed: ["for"],
	callbacks:{
		async connected() {
			const selector = this.attributes.for.value;
			let el = document.querySelector(selector);
			if(el) {
				await recompile(this,el);
			} else {
				console.warn(`source ${selector} does not exist for HCXIncludeElement`);
			}
		},
		async attributeChanged(name,oldValue,newValue) {
			if(name==="for") {
				let el = document.querySelector(newValue);
				if(el) {
					await recompile(this,el);
				} else {
					console.warn(`source ${newValue} does not exist for HCXIncludeElement`);
				}
			}
		}
	},
	observedReactive:true});
HCXIncludeElement.define();

export default HCXIncludeElement;
export {HCXIncludeElement};