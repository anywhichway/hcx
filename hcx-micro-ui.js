import {hcx} from "./index.js";

const HCXMicroUI = hcx. customElement("HCX-micro-UI",'<iframe style="width:100%" srcdoc="<head>${head}</head><body>${body}</body>"></iframe>',{
	callbacks: {
		async connected() {
			const src = this.getAttribute("src");
			if(src) {
				const model = {src};
				this.render(model);
				return;
			}
			let imports = [],
				imported = {};
			try {
				imports = (this.getAttribute("imports")||"").split(",");
			} catch(e) {
				;
			}
			imports.forEach((key) => {
				let value = this.parentElement[key];
				if(value==null) {
					value = this.parentElement.getAttribute(key);
					try {
						value = JSON.parse(value);
					} catch(e) {
						;
					}
				}
				if(value!=null) {
					imported[key] = value;
				}
			});
			const model = {},
				htmlfile = await fetch(this.getAttribute("htmlsrc")),
				text = await htmlfile.text(),
				dom = hcx.asDOM(text),
				scriptsrc = this.getAttribute('scriptsrc');
			model.head = dom.querySelector("head").innerHTML;
			model.body = dom.querySelector("body").innerHTML 
				+ (scriptsrc ? `<script type="${this.getAttribute('type')||'text/javascript'}" src="${this.getAttribute('scriptsrc')}"></script>` : '');
			await this.render(model);
			const contentDocument = this.shadowRoot.firstElementChild.contentDocument;
			//contentDocument.addEventListener("readystatechange",() => {
				setTimeout(() => hcx.compile(contentDocument.querySelector("body"),imported)(),1000);
			//});
		}
	}
});
HCXMicroUI.define();

export default HCXMicroUI;
export {HCXMicroUI};