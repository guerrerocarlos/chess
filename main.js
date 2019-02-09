

var components = {
  assets:
    [
      { type: "a-asset-item", id: "lambda", src: "LAMBDA.gltf" },
      { type: "a-asset-item", id: "apigw", src: "API_Gateway.gltf" },
      { type: "a-asset-item", id: "rds", src: "RDS.gltf" },
      { type: "img", id: "sky", src: "https://cdn.glitch.com/262a1870-f416-4790-ba2f-9c307a56ab4d%2F360_world.jpg?1527120553801", crossorigin: "anonymmous" }
    ],
  objects:
    [
      { type: "a-gltf-model", id: "lambda", src: "#lambda", position: "-3 .2 -4", rotation: "0 0 0", class: "clickable", "collider-check": true },
      { type: "a-gltf-model", id: "apigw", src: "#apigw", position: "0 .2 -4", rotation: "0 0 0", class: "clickable", "collider-check": true },
      { type: "a-gltf-model", id: "rds", src: "#rds", position: "10 .2 -4", rotation: "0 0 0", class: "clickable", "collider-check": true },
      { type: "a-entity", id: "mousecaster", "raycaster-mouse": "objects: .clickable; showLine: false; far: 100", cursor: true },
    ]
}


var componentsEls = {}

for (part in components) {
  components[part].forEach(function (asset) {
    var el = document.createElement(asset.type);
    delete asset['type']
    for (key in asset) {
      el.setAttribute(key, asset[key])
    }
    if (componentsEls[part] === undefined) {
      componentsEls[part] = []
    }
    componentsEls[part].push(el)
  })
}


var assetsEl = document.createElement('a-assets');

componentsEls['assets'].forEach(function(assetEl) {
  assetsEl.appendChild(assetEl)
})

var sceneEl = document.createElement('a-scene');
sceneEl.setAttribute('antialias', 'true')
sceneEl.appendChild(assetsEl)

componentsEls['objects'].forEach(function(assetEl) {
  sceneEl.appendChild(assetEl)
})

var bodyEl = document.querySelector('body');
bodyEl.appendChild(sceneEl)










