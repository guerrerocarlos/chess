
var colors = {
  one: '#123',
  two: '#aaccbb', // 415d8d
  twoBorder: '#000',
  oneBorder: '#fce',
  sky: '#383F4B',
  wood: '#312',
  woodBorder: '#323'
}

var materials = {
  one: { color: colors.one, emissive: colors.one, emissiveIntensity: 1, metalness: 1 },
  two: { color: colors.two, emissive: colors.two, emissiveIntensity: .5, metalness: 1 },
  wood:  { color: colors.wood, emissive: colors.wood, emissiveIntensity: 1 },
  borderWood:  { color: colors.woodBorder, emissive: colors.woodBorder, emissiveIntensity: 1 },
  black: { color: 'black', emissive: 'black', emissiveIntensity: 1 },
  white: { color: 'white', emissive: 'white', emissiveIntensity: 1 },
  borderOne: {color: colors.oneBorder, emissive: colors.oneBorder, emissiveIntensity: 1},
  borderTwo: {color: colors.twoBorder, emissive: colors.twoBorder, emissiveIntensity: 1}
}

var scene = {
  assets: {
    _type: "a-assets",
    children:
    {
      'pawn': { type: "a-asset-item", id: "chessPieces", src: "resources/chessPieces.gltf" },
      'skydome': { id: 'sky', type: "img", src: "resources/skydome1.png" },
    }
  },
  skydome: {
    '_type': 'a-sky',
    'src': '#sky',
  },
  wood: {
    '_type': 'a-entity',
    'gltf-part': `src: #chessPieces; part: Wood`,
    'material': materials.wood,
    'position': { x: 0, y: 0, z: 0 },
  },
  woodBorder: {
    '_type': 'a-entity',
    'gltf-part': `src: #chessPieces; part: Wood_001`,
    'material': materials.borderWood,
    'position': { x: 0, y: 0, z: 0 },
  },
  light1: {
    _type: 'a-light',
    type: 'point',
    position: { x: 0, y: 8, z: 0 },
    color: '#fff'
  },
  light2: {
    _type: 'a-light',
    type: 'point',
    position: { x: 7, y: 6, z: 8 },
    color: '#999'
  },
  cameraRig: {
    _type: 'a-entity',
    id: "rig",
    position: { x: 4, y: 4, z: 8 },
    rotation: { x: 0, y: 0, z: 0 },
    'raycaster-mouse': '',
    // 'look-at': { x: 4, y: 4, z: 8 },
    children: {
      camera: {
        id: 'camera',
        _type: 'a-camera',
        position: { x: 0, y: 0, z: 0 },
        // 'look-at': '#board_4_4',
        // 'id': 'camera',
        // camera: {zoom:1, fov:90, spectator:true},
        camera: {zoom:0.9, fov:60},
        // 'wasd-controls': '', 
        // 'position': '',
        // 'rotation': '',
        'look-controls': 'enabled: false;',
        // 'scale': '',
        // 'visible': '',
      }
    }
  }
}

// create board
for (var i = 0; i < 8; i++) {
  for (var j = 0; j < 8; j++) {
    scene[`board_${i}_${j}`] = {
      _type: 'a-plane',
      id: `board_${i}_${j}`,
      position: { x: i, y: 0, z: j },
      rotation: { x: -90, y: 0, z: 0 },
      width: '1',
      height: '1',
      'material': ((i + j) % 2 == 0) ? materials.black : materials.white,
    }
  }
}

// Add pawns
for (var i = 0; i < 8; i++) {
  for (var j = 0; j < 2; j++) {
    var material = j === 0 ? materials.one : materials.two
    scene[`pawn_${i}_${j}`] = {
      children: {
        blackPawn: {
          '_type': 'a-entity',
          'gltf-part': "src: #chessPieces; part: Pawn",
          rotation: { x: 0, y: 0, z: 0 },
          'material': material
        },
        blackPawnBorder: {
          '_type': 'a-entity',
          'gltf-part': "src: #chessPieces; part: Pawn_001",
          rotation: { x: 0, y: 0, z: 0 },
          'material': j === 0 ? materials.borderOne : materials.borderTwo
        },
      },
      position: { x: i, y: 0, z: 1 + j * 5 },
      // scale: { x: 0.5, y: 0.5, z: 0.5 }, 
    }
  }
}

var pieces = [
  { part: 'Rook', x: 0 },
  { part: 'Horse', x: 1 },
  { part: 'Bishop', x: 2 },
  { part: 'Queen', x: 3 },
  { part: 'King', x: 4 },
  { part: 'Bishop', x: 2 },
  { part: 'Horse', x: 1 },
  { part: 'Rook', x: 0 }
]
for (var i = 0; i < pieces.length; i++) {
  for (var j = 0; j < 2; j++) {
    0
    scene[`${pieces[i]}_${i}_${j}`] = {
      children: {
        piece: {
          '_type': 'a-entity',
          'gltf-part': `src: #chessPieces; part: ${pieces[i].part}`,
          'position': { x: 1 + pieces[i].x, y: 0, z: 0 },
          'rotation': { x: 0, y: 0, z: 0 },
          'material': j === 0 ? materials.one : materials.two
        },
        blackBorder: {
          '_type': 'a-entity',
          'gltf-part': `src: #chessPieces; part: ${pieces[i].part}_001`,
          'position': { x: 1 + pieces[i].x, y: 0, z: 0 },
          'rotation': { x: 0, y: 0, z: 0 },
          'material': j === 0 ? materials.borderOne : materials.borderTwo 
        },
      },
      position: { x: i, y: 0, z: j * 7 },
    }
  }
}


///>> Scene building mechanism
function buildElements(piece) {
  var elements = []
  for (element in piece) {

    var el = document.createElement(piece[element]._type || 'a-entity');

    for (key in piece[element]) {
      if (['_type', 'children'].indexOf(key) === -1) {
        el.setAttribute(key, piece[element][key])
      }
    }

    if (piece[element].children) {
      buildElements(piece[element].children)
        .forEach(function (childrenEl) {
          el.appendChild(childrenEl)
        })
    }

    elements.push(el)
  }
  return elements
}

var sceneEl = document.createElement('a-scene');
sceneEl.setAttribute('antialias', 'true')

var sceneElements = buildElements(scene)
sceneElements.forEach(function (children) {
  sceneEl.appendChild(children)
})

var bodyEl = document.querySelector('body');
bodyEl.appendChild(sceneEl)










