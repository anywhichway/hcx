import {hcx} from "../hcx.js";

const model = hcx.reactor({dark:false});
			
function handleToggle() {
	model.dark = !model.dark;
}

hcx.compile(document.getElementById("app"),model,{listeners:{handleToggle}})(); 