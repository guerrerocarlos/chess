/* global MutationObserver */

// Defines selectors that should be 'safe' for the MutationObserver used to
// refresh the whitelist. Matches classnames, IDs, and presence of attributes.
// Selectors for the value of an attribute, like [position=0 2 0], cannot be
// reliably detected and are therefore disallowed.
var OBSERVER_SELECTOR_RE = /^[\w\s-.,[\]#]*$/;

// Configuration for the MutationObserver used to refresh the whitelist.
// Listens for addition/removal of elements and attributes within the scene.
var OBSERVER_CONFIG = {
    childList: true,
    attributes: true,
    subtree: true
};

/**
 * Raycaster component.
 *
 * Pass options to three.js Raycaster including which objects to test.
 * Poll for intersections.
 * Emit event on origin entity and on target entity on intersect.
 *
 * @member {array} intersectedEls - List of currently intersected entities.
 * @member {array} objects - Cached list of meshes to intersect.
 * @member {number} prevCheckTime - Previous time intersection was checked. To help interval.
 * @member {object} raycaster - three.js Raycaster.
 */
AFRAME.registerComponent('raycaster-mouse', {
    schema: {
        autoRefresh: { default: true },
        direction: { type: 'vec3', default: { x: 0, y: 0, z: -1 } },
        enabled: { default: true },
        far: { default: 1000 },
        interval: { default: 0 },
        near: { default: 0 },
        objects: { default: '' },
        origin: { type: 'vec3' },
        recursive: { default: true },
        showLine: { default: false },
        useWorldCoordinates: { default: false }
    },

    init: function () {
        console.log('init camera')
        this.clearedIntersectedEls = [];
        this.unitLineEndVec3 = new THREE.Vector3();
        this.intersectedEls = [];
        this.intersections = [];
        this.newIntersectedEls = [];
        this.newIntersections = [];
        this.objects = [];
        this.prevCheckTime = undefined;
        this.prevIntersectedEls = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.updateOriginDirection();
        this.setDirty = this.setDirty.bind(this);
        this.observer = new MutationObserver(this.setDirty);
        this.dirty = true;
        this.lineEndVec3 = new THREE.Vector3();
        this.otherLineEndVec3 = new THREE.Vector3();
        this.lineData = { end: this.lineEndVec3 };
        this.lastClientX = -1
        this.lastClientY = -1
        this.mouseDownListening = false
        this.mouseDown = false
        this.circleRads = { R: 12, a: 0, b: 0 }
        this.mouseUpTime = new Date()
        this.justLoaded = true
        // this.cameraObject = document.querySelector('a-camera') //.object3D;
        // this.camera = this.cameraObject.object3D //('camera') //.object3D;
        // // this.camera = this.acamera.getAttribute('camera');


        this.intersectedClearedDetail = { el: this.el };
        this.intersectionClearedDetail = { clearedEls: this.clearedIntersectedEls };
        this.intersectionDetail = {};

        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false);
        if (!document.mouseDownListening) {
            console.log('onmousedown addEventListener')
            document.mouseDownListening = true
            document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false);
            document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this), false);
        }

        this.updateCameraPosition()

        // document.addEventListener('keydown', this.onDocumentKeyDown, false);
        // document.addEventListener('keyup', this.onDocumentKeyUp, false);
    },

    updateCameraPosition: function () {

        if (this.circleRads.b <= Math.PI / 8) {
            this.circleRads.b = Math.PI / 8
        }

        if (this.circleRads.b >= Math.PI / 2) {
            this.circleRads.b = Math.PI / 2
        }


        var rig = document.querySelector('#rig')
        var circle = this.circleRads

        r = circle.R * Math.cos(circle.b)
        y = circle.R * Math.sin(circle.b)

        z = r * Math.cos(circle.a)
        x = r * Math.sin(circle.a)

        rig.object3D.position.set(4 + x, y, 4 + z);
        // console.log('x:', x, 'y:', y, 'z:', z)
        // console.log('circle.a', circle.a, 'circle.b:', circle.b)

        // var cam = document.querySelector('[camera]')
        // console.log('b: ', circle.b.toFixed(2), 'a:', circle.a.toFixed(2))
        // console.log('cam', rig.object3D.rotation)

        rig.object3D.rotation.x = - circle.b
        rig.object3D.rotation.y = circle.a
    },

    setPosition: function (event) {
        // console.log('delta', (this.lastClientX - event.clientX) / 10000)
        this.circleRads.a += (this.lastClientX - event.clientX) / 100
        this.circleRads.b += -(this.lastClientY - event.clientY) / 100
        this.updateCameraPosition()

        this.lastClientX = event.clientX
        this.lastClientY = event.clientY
        // rig.object3D.rotation.z = - Math.PI / 2  //+ circle.a / 2
        // console.log('cam>', rig.object3D.rotation)

    },

    tick: function (a, b) {
        // console.log('tick...', a, b,  !this.mouseDown, this.mouseUpTime.getTime(), new Date().getTime(), this.mouseUpTime.getTime() > new Date().getTime() + 4000)
        if (this.justLoaded||!this.mouseDown && this.mouseUpTime.getTime() + 3000 < new Date().getTime()) {
            // console.log('move it!')
            this.circleRads.a += 1 / 1000
            this.updateCameraPosition()
        }
    },

    onDocumentMouseMove: function (event) {
        event.preventDefault();
        // console.log('mouseMove event', event)
        if (this.mouseDown) {
            this.setPosition(event)
        }

        // this.refreshObjects()
        // this.mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
        // this.raycaster.setFromCamera(this.mouse, this.camera);
        // var intersects = this.raycaster.intersectObjects(this.objects);
        // // if (intersects.length > 0) {
        // //     var intersect = intersects[0];
        // //     // rollOverMesh.position.copy(intersect.point).add(intersect.face.normal);
        // //     // rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        // // }
        // console.log('intersects', intersects)
        // // render();
    },

    onDocumentMouseUp: function (event) {
        this.mouseDown = false
        this.mouseUpTime = new Date()
    },

    onDocumentMouseDown: function (event) {
        event.preventDefault();

        this.justLoaded = false

        this.lastClientX = event.clientX
        this.lastClientY = event.clientY

        console.log('mouseDown event', event)
        this.mouseDown = true
        this.setPosition(event)

        if (event.isTrusted && event.clientX !== this.lastClientX && event.clientY !== this.lastClientY) {
            console.log('\n<onDocumentMouseDown>', event)
            // this.lastClientX = event.clientX
            // this.lastClientY = event.clientY
            this.mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
            this.checkIntersections()
        }


        // this.refreshObjects()
        // this.camera = this.el.getObject3D('camera')
        // console.log('camera;', this.camera)

        // console.log('intersects', intersects)

        // if (intersects.length > 0) {
        //     var intersect = intersects[0];
        //     // delete cube
        //     // if (isShiftDown) {
        //     //     if (intersect.object !== plane) {
        //     //         scene.remove(intersect.object);
        //     //         objects.splice(objects.indexOf(intersect.object), 1);
        //     //     }
        //     //     // create cube
        //     // } else {
        //         // var voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
        //         // voxel.position.copy(intersect.point).add(intersect.face.normal);
        //         // voxel.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
        //         // scene.add(voxel);
        //         // objects.push(voxel);
        //     // }
        //     render();
        // }
    },


    onDocumentKeyDown: function (event) {
        switch (event.keyCode) {
            case 16: isShiftDown = true; break;
        }
    },

    onDocumentKeyUp: function (event) {
        switch (event.keyCode) {
            case 16: isShiftDown = false; break;
        }
    },
    /**
     * Create or update raycaster object.
     */
    update: function (oldData) {
        console.log('update... oldData', oldData)

        var data = this.data;
        var el = this.el;
        var raycaster = this.raycaster;

        // Set raycaster properties.
        raycaster.far = data.far;
        raycaster.near = data.near;

        // Draw line.
        if (data.showLine &&
            (data.far !== oldData.far || data.origin !== oldData.origin ||
                data.direction !== oldData.direction || !oldData.showLine)) {
            // Calculate unit vector for line direction. Can be multiplied via scalar to performantly
            // adjust line length.
            this.unitLineEndVec3.copy(data.origin).add(data.direction).normalize();
            this.drawLine();
        }

        if (!data.showLine && oldData.showLine) {
            el.removeAttribute('line');
        }

        if (data.objects !== oldData.objects && !OBSERVER_SELECTOR_RE.test(data.objects)) {
            warn('Selector "' + data.objects + '" may not update automatically with DOM changes.');
        }

        if (data.autoRefresh !== oldData.autoRefresh && el.isPlaying) {
            data.autoRefresh
                ? this.addEventListeners()
                : this.removeEventListeners();
        }

        this.setDirty();
    },

    play: function () {
        this.addEventListeners();
    },

    pause: function () {
        this.removeEventListeners();
    },

    remove: function () {
        if (this.data.showLine) {
            this.el.removeAttribute('line');
        }
    },

    addEventListeners: function () {
        if (!this.data.autoRefresh) { return; }
        this.observer.observe(this.el.sceneEl, OBSERVER_CONFIG);
        this.el.sceneEl.addEventListener('object3dset', this.setDirty);
        this.el.sceneEl.addEventListener('object3dremove', this.setDirty);
    },

    removeEventListeners: function () {
        this.observer.disconnect();
        this.el.sceneEl.removeEventListener('object3dset', this.setDirty);
        this.el.sceneEl.removeEventListener('object3dremove', this.setDirty);
    },

    /**
     * Mark the object list as dirty, to be refreshed before next raycast.
     */
    setDirty: function () {
        this.dirty = true;
    },

    /**
     * Update list of objects to test for intersection.
     */
    refreshObjects: function () {
        var data = this.data;
        var els;

        // If objects not defined, intersect with everything.
        els = data.objects
            ? this.el.sceneEl.querySelectorAll(data.objects)
            : this.el.sceneEl.children;
        this.objects = this.flattenChildrenShallow(els);
        this.dirty = false;
        // console.log('<refreshObjects> this.objects:', this.objects)
    },

    /**
     * Check for intersections and cleared intersections on an interval.
     */
    // tick: function (time) {
    // var data = this.data;
    // var prevCheckTime = this.prevCheckTime;

    // // Only check for intersection if interval time has passed.
    // if (prevCheckTime && (time - prevCheckTime < data.interval)) { return; }

    // // Update check time.
    // this.prevCheckTime = time;
    // this.checkIntersections();
    // },

    /**
     * Raycast for intersections and emit events for current and cleared inersections.
     */
    checkIntersections: function () {
        // console.log('<checkIntersections>', this)
        // var cameras = this.objects.filter((each) => {
        //     return each.type.indexOf("PerspectiveCamera") === 0
        // })
        // console.log('CAMERA:::', cameras)
        var clearedIntersectedEls = this.clearedIntersectedEls;
        var el = this.el;
        var data = this.data;
        var i;
        var intersectedEls = this.intersectedEls;
        var intersection;
        var intersections = this.intersections;
        var lineLength;
        var newIntersectedEls = this.newIntersectedEls;
        var newIntersections = this.newIntersections;
        var prevIntersectedEls = this.prevIntersectedEls;
        var rawIntersections;
        var self = this;

        if (!this.data.enabled) { return; }

        // Refresh the object whitelist if needed.
        if (this.dirty) { this.refreshObjects(); }

        // Store old previously intersected entities.
        copyArray(this.prevIntersectedEls, this.intersectedEls);

        // Raycast.
        this.updateOriginDirection();

        // console.log('CAMERA:', AFRAME.systems)

        // this.raycaster.setFromCamera(this.mouse, cameras[0]);
        // var intersects = this.raycaster.intersectObjects(this.objects);

        rawIntersections = this.raycaster.intersectObjects(this.objects, data.recursive);
        // console.log('rawIntersections', rawIntersections)

        // Only keep intersections against objects that have a reference to an entity.
        intersections.length = 0;
        intersectedEls.length = 0;
        for (i = 0; i < rawIntersections.length; i++) {
            intersection = rawIntersections[i];
            // Don't intersect with own line.
            // if (data.showLine && intersection.object === el.getObject3D('camera')) {
            //     continue;
            // }
            if (intersection.object.el) {
                intersections.push(intersection);
                intersectedEls.push(intersection.object.el);
            }
        }

        // Get newly intersected entities.
        newIntersections.length = 0;
        newIntersectedEls.length = 0;
        for (i = 0; i < intersections.length; i++) {
            if (prevIntersectedEls.indexOf(intersections[i].object.el) === -1) {
                newIntersections.push(intersections[i]);
                newIntersectedEls.push(intersections[i].object.el);
            }
        }

        // Emit intersection cleared on both entities per formerly intersected entity.
        clearedIntersectedEls.length = 0;
        for (i = 0; i < prevIntersectedEls.length; i++) {
            if (intersectedEls.indexOf(prevIntersectedEls[i]) !== -1) { continue; }
            prevIntersectedEls[i].emit('raycaster-intersected-cleared',
                this.intersectedClearedDetail);
            clearedIntersectedEls.push(prevIntersectedEls[i]);
        }
        if (clearedIntersectedEls.length) {
            el.emit('raycaster-intersection-cleared', this.intersectionClearedDetail);
        }
        // console.log('newIntersectedEls', newIntersectedEls)
        // Emit intersected on intersected entity per intersected entity.

        var emitedUuid = []

        for (i = 0; i < newIntersectedEls.length; i++) {
            if (emitedUuid.indexOf(newIntersectedEls[i].object3D.uuid) === -1) {
                // console.log('Emit raycaster-intersected on:', newIntersectedEls[i].object3D.uuid)
                newIntersectedEls[i].emit('raycaster-intersected', {
                    el: el,
                    intersection: newIntersections[i]
                });
                emitedUuid.push(newIntersectedEls[i].object3D.uuid)
            }
        }

        // Emit all intersections at once on raycasting entity.
        if (newIntersections.length) {
            this.intersectionDetail.els = newIntersectedEls;
            this.intersectionDetail.intersections = newIntersections;
            el.emit('raycaster-intersection', this.intersectionDetail);
        }

        // Update line length.
        // setTimeout(function () {
        //     if (self.data.showLine) {
        //         if (intersections.length) {
        //             if (intersections[0].object.el === el && intersections[1]) {
        //                 lineLength = intersections[1].distance;
        //             } else {
        //                 lineLength = intersections[0].distance;
        //             }
        //         }
        //         self.drawLine(lineLength);
        //     }
        // });
    },

    /**
     * Update origin and direction of raycaster using entity transforms and supplied origin or
     * direction offsets.
     */
    updateOriginDirection: (function () {
        var direction = new THREE.Vector3();
        var originVec3 = new THREE.Vector3();

        // Closure to make quaternion/vector3 objects private.
        return function updateOriginDirection() {
            var el = this.el;
            var data = this.data;

            // if (data.useWorldCoordinates) {
            //     this.raycaster.set(data.origin, data.direction);
            //     return;
            // }

            // Grab the position and rotation.
            el.object3D.updateMatrixWorld();
            // el.object3D.getWorldPosition(originVec3);

            // var cameras = this.objects.filter((each) => {
            //     return each.type.indexOf("PerspectiveCamera") === 0
            // })
            var cameraEl = document.querySelector('#camera').object3D.children[0]
            // console.log('cameraEl', cameraEl.object3D.children[0])
            // console.log('this.mouse', this.mouse)
            // console.log('cameraEl', cameraEl)
            if (cameraEl) {
                this.raycaster.setFromCamera(this.mouse, cameraEl);
            }


            // If non-zero origin, translate the origin into world space.
            // if (data.origin.x !== 0 || data.origin.y !== 0 || data.origin.z !== 0) {
            //     originVec3 = el.object3D.localToWorld(originVec3.copy(data.origin));
            // }

            // three.js raycaster direction is relative to 0, 0, 0 NOT the origin / offset we
            // provide. Apply the offset to the direction, then rotation from the object,
            // and normalize.
            // direction.copy(data.direction).transformDirection(el.object3D.matrixWorld).normalize();

            // Apply offset and direction, in world coordinates.
            // this.raycaster.set(originVec3, direction);
        };
    })(),

    /**
     * Create or update line to give raycaster visual representation.
     * Customize the line through through line component.
     * We draw the line in the raycaster component to customize the line to the
     * raycaster's origin, direction, and far.
     *
     * Unlike the raycaster, we create the line as a child of the object. The line will
     * be affected by the transforms of the objects, so we don't have to calculate transforms
     * like we do with the raycaster.
     *
     * @param {number} length - Length of line. Pass in to shorten the line to the intersection
     *   point. If not provided, length will default to the max length, `raycaster.far`.
     */
    drawLine: function (length) {
        var data = this.data;
        var el = this.el;
        var endVec3;

        // Switch each time vector so line update triggered and to avoid unnecessary vector clone.
        endVec3 = this.lineData.end === this.lineEndVec3
            ? this.otherLineEndVec3
            : this.lineEndVec3;

        // Treat Infinity as 1000m for the line.
        if (length === undefined) {
            length = data.far === Infinity ? 1000 : data.far;
        }

        // Update the length of the line if given. `unitLineEndVec3` is the direction
        // given by data.direction, then we apply a scalar to give it a length.
        this.lineData.start = data.origin;
        this.lineData.end = endVec3.copy(this.unitLineEndVec3).multiplyScalar(length);
        el.setAttribute('line', this.lineData);
    },

    /**
     * Return children of each element's object3D group. Children are flattened
     * by one level, removing the THREE.Group wrapper, so that non-recursive
     * raycasting remains useful.
     *
     * @param  {Array<Element>} els
     * @return {Array<THREE.Object3D>}
     */
    flattenChildrenShallow: (function () {
        var groups = [];

        return function (els) {
            var children;
            var i;
            var objects = this.objects;

            // Push meshes onto list of objects to intersect.
            groups.length = 0;
            for (i = 0; i < els.length; i++) {
                if (els[i].object3D) {
                    groups.push(els[i].object3D);
                }
            }

            // Each entity's root is a THREE.Group. Return the group's chilrden.
            objects.length = 0;
            for (i = 0; i < groups.length; i++) {
                children = groups[i].children;
                if (children && children.length) {
                    objects.push.apply(objects, children);
                }
            }
            return objects;
        };
    })()
});

/**
 * Copy contents of one array to another without allocating new array.
 */
function copyArray(a, b) {
    var i;
    a.length = b.length;
    for (i = 0; i < b.length; i++) {
        a[i] = b[i];
    }
}
