const DEBUG = true;


const main = () => {
	const power_search = top.document.createElement("div");
	power_search.innerHTML = `
<div style="width:100%; height: 100%; background-color:#f005;position:fixed;top:0px;left:0px; z-index:99 ">
	<div style="display: flex; flex-direction:row ">
		<input type="text">
	</div>
</div>
`
	top.document.body.appendChild(power_search);
}
