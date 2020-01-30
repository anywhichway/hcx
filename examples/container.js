import {hcx} from "../index.js";

const MyContainer = hcx.customElement("my-container",null,{listeners:{onclick() { alert('clicked')}}});
MyContainer.define();