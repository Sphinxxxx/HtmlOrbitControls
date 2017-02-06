function HtmlOrbitControls(element, options) {

    function Viewport(element, options) {

        let _pendingDeltas;

        const collectMove = (function(deltas) {
            if(!_pendingDeltas) {
                _pendingDeltas = deltas;
            }
            else {
                if(deltas.x) { _pendingDeltas.x = (_pendingDeltas.x || 0) + deltas.x; }
                if(deltas.y) { _pendingDeltas.y = (_pendingDeltas.y || 0) + deltas.y; }
                if(deltas.z) { _pendingDeltas.z = (_pendingDeltas.z || 0) + deltas.z; }
            }
            //console.log(deltas, _pendingDeltas);
        }).bind(this);

        const move = (function() {
            const deltas = _pendingDeltas;
            if(!deltas) { return; }

            function normalizedAngle(a) {
                let aa = a % 360;
                if(aa < 0) { aa += 360; }
                return aa;
            }

            if(typeof deltas.x === "number") {
                this.x += deltas.x;
            }
            if(typeof deltas.y === "number") {
                //Reverse mouse direction when the object is upside-down:
                const normX = normalizedAngle(this.x);
                if((normX > 90) && (normX < 270)) {
                    this.y -= deltas.y;
                }
                else {
                    this.y += deltas.y;
                }
            }
            if(typeof deltas.z === "number") {
                this.z += deltas.z;
            }

            this.el.style.transitionDuration = deltas.speed ? deltas.speed + 'ms' : null;
            this.el.style.transform = `perspective(${this.p}px) translateZ(${this.z}px) rotateX(${this.x}deg) rotateY(${this.y}deg)`;

            _pendingDeltas = null;
        }).bind(this);


        const init = (function() {
            this.el = element;

            this.x = -10;
            this.y = 20;
            this.z = 0;
            this.p = (window.innerWidth + window.innerHeight)/2;

            if(options) {
                if(typeof options.x === "number") { this.x = options.x; }
                if(typeof options.y === "number") { this.y = options.y; }
                if(typeof options.z === "number") { this.p/*z*/ = options.z; }
            }

            //Empty object (instead of null) just to trigger the initial rendering:
            _pendingDeltas = {};
        }).bind(this);


        function moveLoop() {
            move();
            requestAnimationFrame(moveLoop);
        }

        init();
        moveLoop();


        //Public functions:
        this.move = collectMove;
        this.reset = init;
    }


    const mouse = {},
          touch = document.ontouchmove !== undefined,
          viewport = new Viewport(element, options),
          container = (options && options.container) || document;

    //container.addEventListener('keydown', handleKey);
    document.addEventListener('keydown', function(e) {
        var tag = e.target.nodeName.toLowerCase();
        if(tag === 'input') { return; }

        handleKey(e);
    });
    container.addEventListener('mousedown', handleDown);
    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseup', handleUp);
    container.addEventListener('wheel', handleWheel);
    if(touch) {
        container.addEventListener('touchstart', handleDown);
        container.addEventListener('touchmove', handleMove);
        container.addEventListener('touchend', handleUp);
    }

    /* Event handlers */

    function handleKey(e) {
        //console.log(evt.keyCode);
        const speed = options.speed || 200;

        switch(e.keyCode) {
            case 37: // left
                viewport.move({y: -90, speed: speed});
                break;

            case 38: // up
                e.preventDefault();
                viewport.move({x: 90, speed: speed});
                break;

            case 39: // right
                viewport.move({y: 90, speed: speed});
                break;

            case 40: // down
                e.preventDefault();
                viewport.move({x: -90, speed: speed});
                break;

            case 27: //esc
                viewport.reset();
                break;

            default:
                break;
        };
    }

    function handleDown(e) {
        //Disables "focusing" the page, and then we can't use keyboard navigation.
        //  e.preventDefault();

        mouse.start = getMousePos(e);
    }

    function handleMove(e) {
        if(!mouse.start) { return; }
        // Only perform rotation if one touch or mouse (e.g. still scale with pinch and zoom)
        if(touch && e.touches && (e.touches.length > 1)) { return; }

        e.preventDefault();

        moveViewport(getMousePos(e));
    }

    function handleUp(e) {
        mouse.start = null;
    }

    function handleWheel(e) {
        let zoomed = e.deltaY;
        //Firefox uses a different deltaMode and thus scroll speed than other browsers...
        //https://github.com/cubiq/iscroll/issues/577#issuecomment-33715370
        zoomed *= (e.deltaMode === 1) ? 7 : .2;

        viewport.move({ z: -zoomed });
    }

    /* Event handler utils */

    function getMousePos(evt) {
        if(evt.touches) { evt = evt.touches[0]; }
        return { x: evt.pageX, y: evt.pageY };
    }

    function moveViewport(mousePos) {
        // Reduce movement on touch screens
        var movementScaleFactor = touch ? 4 : 1;

        const dx = (mouse.start.x - mousePos.x)/movementScaleFactor,
              dy = (mouse.start.y - mousePos.y)/movementScaleFactor;
        viewport.move({
            x: dy,
            y: -dx
        });

        mouse.start = mousePos;
    }

}
