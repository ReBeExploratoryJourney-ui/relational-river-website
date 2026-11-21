/*
 * River runtime: renders the Relational River's page templates.
 *
 * Each page has an <x-dc> block (the template, with {{holes}}, <sc-for> and
 * <sc-if>) and a <script type="text/x-dc"> block defining
 * `class Component extends DCLogic` with a renderVals() method.
 * This file turns those into a live page and updates the DOM in place
 * whenever setState() is called, so focus, hover and scroll are kept.
 */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var BOOL_PROPS = { checked: 1, disabled: 1, selected: 1, open: 1, hidden: 1, readonly: 1, required: 1 };
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

  var component = null;
  var mount = null;
  var template = null;
  var pending = false;

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state) : patch;
    for (var k in next) { if (Object.prototype.hasOwnProperty.call(next, k)) { this.state[k] = next[k]; } }
    schedule();
  };
  window.DCLogic = DCLogic;

  function schedule() {
    if (pending || !component) { return; }
    pending = true;
    Promise.resolve().then(function () { pending = false; render(); });
  }

  // ---- expression lookup ----
  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') { return true; }
    if (expr === 'false') { return false; }
    if (expr === 'null') { return null; }
    if (/^-?\d+(\.\d+)?$/.test(expr)) { return parseFloat(expr); }
    if (/^'.*'$|^".*"$/.test(expr)) { return expr.slice(1, -1); }
    var parts = expr.split('.');
    var v;
    for (var i = scope.length - 1; i >= 0; i--) {
      if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], parts[0])) { v = scope[i][parts[0]]; break; }
    }
    for (var j = 1; j < parts.length && v != null; j++) { v = v[parts[j]]; }
    return v;
  }
  function single(str) {
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str);
    return m ? m[1] : null;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) { var v = lookup(e, scope); return v == null ? '' : String(v); });
  }
  function eventName(attr, el) {
    var n = attr.slice(2).toLowerCase();
    if (n === 'change') {
      var tag = el.tagName.toLowerCase(), type = (el.getAttribute('type') || '').toLowerCase();
      if (tag === 'textarea' || (tag === 'input' && type !== 'checkbox' && type !== 'radio')) { return 'input'; }
    }
    return n;
  }

  // ---- build a virtual copy of the template for the current values ----
  function build(node, scope, out) {
    if (node.nodeType === 3) {
      out.push({ t: 3, v: interp(node.nodeValue, scope) });
      return;
    }
    if (node.nodeType !== 1) { return; }
    var tag = node.localName;
    if (tag === 'sc-for') {
      var list = lookup(single(node.getAttribute('list')) || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var frame = {}; frame[as] = list[i]; frame[as + 'Index'] = i;
        var s2 = scope.concat([frame]);
        for (var c = node.firstChild; c; c = c.nextSibling) { build(c, s2, out); }
      }
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(single(node.getAttribute('value')) || 'false', scope)) {
        for (var d = node.firstChild; d; d = d.nextSibling) { build(d, scope, out); }
      }
      return;
    }
    var v = { t: 1, tag: node.tagName, ns: node.namespaceURI, attrs: {}, props: {}, on: {}, kids: [] };
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a], name = at.name, val = at.value;
      if (name.indexOf('hint-') === 0) { continue; }
      if (/^on/i.test(name)) {
        var fn = lookup(single(val) || '', scope);
        if (typeof fn === 'function') { v.on[name] = fn; }
        continue;
      }
      var one = single(val);
      if (one !== null && BOOL_PROPS[name.toLowerCase()]) { v.props[name.toLowerCase()] = !!lookup(one, scope); continue; }
      var str = interp(val, scope);
      if (name === 'value' && (tag === 'textarea' || tag === 'input' || tag === 'select')) { v.props.value = str; continue; }
      v.attrs[name] = str;
    }
    if (tag === 'template') { return; }
    var kidsRoot = tag === 'template' ? node.content : node;
    for (var k = kidsRoot.firstChild; k; k = k.nextSibling) { build(k, scope, v.kids); }
    out.push(v);
  }

  // ---- create / patch real DOM ----
  function dispatch(e) {
    var h = this.__rr && this.__rr[e.type];
    if (h) { h.call(this, e); }
  }
  function applyHandlers(el, v) {
    el.__rr = el.__rr || {};
    var seen = {};
    for (var n in v.on) {
      var type = eventName(n, el);
      seen[type] = 1;
      if (!el.__rr[type]) { el.addEventListener(type, dispatch); }
      el.__rr[type] = v.on[n];
    }
    for (var t in el.__rr) { if (!seen[t]) { el.removeEventListener(t, dispatch); delete el.__rr[t]; } }
  }
  function applyProps(el, v) {
    for (var p in v.props) {
      if (p === 'value') {
        if (el.value !== v.props.value && document.activeElement !== el) { el.value = v.props.value; }
      } else if (el[p] !== v.props[p]) { el[p] = v.props[p]; }
    }
  }
  function create(v) {
    if (v.t === 3) { return document.createTextNode(v.v); }
    var el = v.ns && v.ns !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag);
    for (var a in v.attrs) { el.setAttribute(a, v.attrs[a]); }
    for (var i = 0; i < v.kids.length; i++) { el.appendChild(create(v.kids[i])); }
    applyHandlers(el, v);
    applyProps(el, v);
    return el;
  }
  function same(el, v) {
    if (v.t === 3) { return el.nodeType === 3; }
    return el.nodeType === 1 && el.tagName === v.tag && el.namespaceURI === (v.ns || el.namespaceURI);
  }
  function patch(el, v) {
    if (v.t === 3) { if (el.nodeValue !== v.v) { el.nodeValue = v.v; } return; }
    var attrs = el.attributes;
    for (var i = attrs.length - 1; i >= 0; i--) {
      var n = attrs[i].name;
      if (!Object.prototype.hasOwnProperty.call(v.attrs, n)) { el.removeAttribute(n); }
    }
    for (var a in v.attrs) { if (el.getAttribute(a) !== v.attrs[a]) { el.setAttribute(a, v.attrs[a]); } }
    applyHandlers(el, v);
    applyProps(el, v);
    patchKids(el, v.kids);
  }
  function patchKids(parent, kids) {
    var cur = parent.firstChild, i = 0;
    for (; i < kids.length; i++) {
      var v = kids[i];
      if (cur && same(cur, v)) { patch(cur, v); cur = cur.nextSibling; }
      else {
        var fresh = create(v);
        if (cur) { parent.replaceChild(fresh, cur); cur = fresh.nextSibling; }
        else { parent.appendChild(fresh); }
      }
    }
    while (cur) { var nx = cur.nextSibling; parent.removeChild(cur); cur = nx; }
  }

  function render() {
    var vals = component.renderVals() || {};
    var out = [];
    for (var c = template.firstChild; c; c = c.nextSibling) { build(c, [vals], out); }
    patchKids(mount, out);
  }

  function start() {
    var host = document.getElementById('rr-template');
    var script = document.querySelector('script[type="text/x-dc"]');
    if (!host || !script) { return; }
    template = host.content;
    mount = document.createElement('div');
    mount.className = 'rr-root';
    host.parentNode.replaceChild(mount, host);
    var Component = new Function('DCLogic', script.textContent + '\n;return Component;')(DCLogic);
    component = new Component({});
    if (!component.state) { component.state = {}; }
    render();
    if (typeof component.componentDidMount === 'function') { component.componentDidMount(); }
    window.addEventListener('pagehide', function () {
      if (typeof component.componentWillUnmount === 'function') { component.componentWillUnmount(); }
    });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); }
  else { start(); }
})();
