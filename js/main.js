
var currentKbdInput = '',
	matchingCommand = '',
	selectedEl = null,
	styleSheet,
	rules = {},
	MAX_HISTORY_SIZE = 300,
	commandHistory = ['padding: ', 'margin: ', 'color: ', 'border: '],
	defaultCommands = ['edit', 'add div', 'remove', 'restart', 'code'];

var commandEl = document.querySelector('#js-command'),
	commandSuggestionEl = document.querySelector('#js-command-suggestion'),
	codeWrapEl = document.querySelector('#js-code-wrap'),
	htmlCodeEl = document.querySelector('#js-html-code'),
	aboutOpenBtnEl = document.querySelector('#js-about-btn'),
	aboutCloseBtnEl = document.querySelector('#js-about-close-btn'),
	about = document.querySelector('#js-about');


function handleKbdCommands () {
	var match;

	// Strip COMMAND_END_CHAR from end.
	if (currentKbdInput.match(/;$/)) {
		currentKbdInput = currentKbdInput.substring(0, currentKbdInput.length - 1);
	}

	if (match = currentKbdInput.match(REGEX_CLEAR)) {}

	else if (match = currentKbdInput.match(REGEX_EDIT)) {
		edit(selectedEl);
	}

	else if (match = currentKbdInput.match(REGEX_CSS)) {
		addCSS(selectedEl, match[1], match[2]);
	}

	else if (match = currentKbdInput.match(REGEX_ADD_ELEMENT)) {
		addElement(match[1], selectedEl);
	}

	else if (match = currentKbdInput.match(REGEX_REMOVE_ELEMENT)) {
		removeElement(selectedEl);
	}

	else if (match = currentKbdInput.match(REGEX_RESTART)) {
		restart();
	}
	else if (match = currentKbdInput.match(REGEX_SHOW_CODE)) {
		showCode();
	}
	else if (match = currentKbdInput.match(REGEX_SHOW_ABOUT)) {
		toggleAbout();
	}
}

function restart() {
	// Remove all expect first child in BODY. Its out UI.
	var children = [].slice.call(document.body.children, 1);
	[...children].forEach(child => child.remove())

	selectedEl = null;
}

function addElement(tag, insideWhat, html) {
	tag = tag || 'div';
	insideWhat = insideWhat || document.body;
	html = html || 'New ' + tag.toUpperCase();

	var el = document.createElement(tag);
	el.innerHTML = html;
	insideWhat.appendChild(el);

	if (!selectedEl) {
		selectElement(el);
	}
}

function removeElement(el) {
	if (!el) return;
	var parentNode = el.parentNode;
	if (selectedEl === el) {
		selectElement(parentNode);
	}
	parentNode.removeChild(el);
}

function addCSS(el, prop, value) {
	if (!el || !prop || !value) return;

	var firstClass = el.classList[0],
		rule;

	selectedEl.style += `${prop}: ${value}`;
}

function edit(el) {
	// Un-edit current element being edited.
	var elementBeingEdited = document.querySelector('[contentEditable=true]');
	if (elementBeingEdited) {
		elementBeingEdited.contentEditable = false;
	}

	if (!el) return;

	// HACK to ignore last keypress from getting inserted
	setTimeout(function () {
		el.contentEditable = true;
		el.focus();
	}, 10);
}

function selectElement(el) {
	if (selectedEl) {
		selectedEl.classList.remove('is-selected');
	}
	selectedEl = el;
	selectElement.contentEditable = false;
	selectedEl.classList.add('is-selected');
}

function navigate(arrow) {
	if (!selectedEl || isElementBeingEdited()) return;
	// left/right - sibling traversal
	// up/down - parent/child traversal

	// Left & right
	if (arrow === 37 && selectedEl.previousElementSibling && selectedEl.previousElementSibling !== document.body.children[0]) {
		selectElement(selectedEl.previousElementSibling);
	}
	else if (arrow === 39 && selectedEl.nextElementSibling) {
		selectElement(selectedEl.nextElementSibling);
	}
	// Up & down
	else if (arrow === 38 && selectedEl.parentNode && selectedEl.parentNode != document.body) {
		selectElement(selectedEl.parentNode);
	}
	else if (arrow === 40 && selectedEl.children.length) {
		selectElement(selectedEl.children[0]);
	}
}

function isElementBeingEdited () {
	if (selectedEl && selectedEl.contentEditable === 'true') return true;
	return false;
}

function updateCommandUI() {
	matchingCommand = getBestMatchingCommandFromHistory(currentKbdInput);

	// commandEl.value = currentKbdInput;
	commandSuggestionEl.value = (matchingCommand || '');
}

function addToHistory(command) {
	commandHistory.push(command);
	if (commandHistory.length > MAX_HISTORY_SIZE) {
		commandHistory.splice(0, 1);
	}
}


// Returns lastest that starts with the passed `command`.
function getBestMatchingCommandFromHistory(command) {
	if (!command) return false;
	var commandRegex = new RegExp('^' + escapeForRegex(command));

	for (var i = commandHistory.length; i--;) {
		if (commandRegex.test(commandHistory[i])) {
			return commandHistory[i];
		}
	}
	for (var i = defaultCommands.length; i--;) {
		if (commandRegex.test(defaultCommands[i])) {
			return defaultCommands[i];
		}
	}
}

function escapeForRegex(str) {
	return str.replace(/(\(|\)|\+|=|\[)/g, '\\$1');
}
function escapeHTML(html) {
	return html.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function cleanHTML(html) {
	return html.replace(/is-selected/g, '');
}

function showCode() {
	// Get all <body> children except last one.
	var bodyChildren = Array.prototype.slice.call(document.body.children, 1);
	var allHtml = bodyChildren.reduce(function reduceCallback(html, el) {
		return el.outerHTML + html;
	}, '');
	allHtml = cleanHTML(allHtml);

	$(codeWrapEl).find('code').html(escapeHTML(allHtml));
	Prism.highlightAll()

	codeWrapEl.classList.add('show');
}

function hideCode() {
	codeWrapEl.classList.remove('show')
}

function onKeyDown(e) {
	// Tab key selects the current suggestion, if any.
	if (e.which === 9) {
		e.preventDefault();
		if (!matchingCommand) return;
		currentKbdInput = matchingCommand;
		commandEl.value = currentKbdInput;
		updateCommandUI();
	}
}

function onKeyUp(e) {
	// Don't record keypresses when editing something, except escape key
	if (isElementBeingEdited() && e.which === 27) {
		edit(null); // Unedit current element.
		commandEl.focus();
		return;
	}

	// Escape key
	if (e.which === 27) {
		hideCode();
		if (about.classList.contains('is-open')) {
			toggleAbout();
		}
		commandEl.focus();
		return;
	}
	// Arrow keys navigate the DOM...only if user isn't typing any command
	else if ({37: 1, 38: 1, 39: 1, 40: 1}[e.which] && !commandEl.value) {
		navigate(e.which);
		return;
	}

	var c = String.fromCharCode(e.which).toLowerCase();
	currentKbdInput = commandEl.value;

	// remove ; from end
	if (c === COMMAND_END_CHAR) {
		// currentKbdInput = currentKbdInput.substring(0, currentKbdInput.length - 1);
	}
	if (c === COMMAND_END_CHAR || e.which === 13) {
		handleKbdCommands();
		addToHistory(currentKbdInput);
		currentKbdInput = '';
		commandEl.value = currentKbdInput;
	}

	updateCommandUI();
}

function onMouseClick(e) {
	var target = e.target;
	if (!target || target.tagName.toLowerCase() === 'body' || target.tagName.toLowerCase() === 'html') return;

	selectElement(target);
}

function toggleAbout() {
	about.classList.toggle('is-open');
	if (!about.classList.contains('is-open')) {
		commandEl.focus();
	}
}
function init() {
	var style = document.createElement('style');
	style.type = 'text/css';
	// WebKit hack :(
	style.appendChild(document.createTextNode(""));
	document.head.appendChild(style);
	styleSheet = style.sheet;

	superplaceholder({
		el: commandEl,
		sentences: [
			'Type in commands to create HTML', 'add div', 'border: 2px solid',
			'Select elements using arrow keys'
		],
		options: {
			letterDelay: 50,
			loop: true,
		}
	});

	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);
	document.body.classList.add('is-loaded');
	aboutOpenBtnEl.addEventListener('click', toggleAbout);
	aboutCloseBtnEl.addEventListener('click', toggleAbout);
	//window.addEventListener('click', onMouseClick);
}

function log() {
	if (window.DEBUG === false) return;
	console.log.apply(console, [].splice.call(arguments, 0));
}

window.addEventListener('load', function onLoad() {
	init();
})
