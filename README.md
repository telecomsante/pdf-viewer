

# &lt;pdf-viewer&gt;

`pdf-viewer` is a simple viewer, without any decoration. Buttons have to be
created by the parent page or component.

![](demo.gif)

<!---
```
<custom-element-demo>
  <template>
    <script src="../webcomponentsjs/webcomponents-lite.js"></script>
    <link rel="import" href="paper-fab.html">
    <link rel="import" href="../iron-icons/iron-icons.html">
    <style is="custom-style">
      pdf-viewer {
        width: 80%;
        height: 500px;
        margin: auto;
      }

      .container {
        display: flex;
        align-items: center;
      }
    </style>
    <div class="container">
      <next-code-block></next-code-block>
    </div>
  </template>
</custom-element-demo>
```
-->
```html
<pdf-viewer src="https://www.w3.org/TR/1998/REC-html40-19980424/html40.pdf"
  initial-zoom="fit-width",
  mode="double",
  page="5"></pdf-viewer>
```
