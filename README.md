[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/telecomsante/pdf-viewer)

# &lt;pdf-viewer&gt;

`pdf-viewer` is a simple viewer, without any decoration. Buttons have to be created by the parent page or component.

the component is written using es6 syntax, a transcompiled version is also provided for older browsers, in this case use `pdf-viewer.es5.html` :

```html
<link rel="import" href="bower_components/pdf-viewer/pdf-viewer.es5.html">
```

Demo and doc are available on https://telecomsante.github.io/pdf-viewer/

![](demo.gif)

Basic usage :

```html
<pdf-viewer   
  src="https://www.w3.org/TR/1998/REC-html40-19980424/html40.pdf"
  initial-zoom="fit-width",
  mode="double",
  page="5"></pdf-viewer>
```

The component is licensed under the [ISC License](LICENSE.md)
