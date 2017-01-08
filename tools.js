/**
 * Created by Near on 2015/10/7.
 */
(function(global){
    function initCanvas (p) {
        var p1 = {
            w: 600,
            h: 400,
            domNode: document.body
        }

        for(var k in p) {
            if(p[k] && p1[k]) {
                p1[k] = p[k]
            }
        }

        var canvas = document.createElement("canvas");
        canvas.width = p1.w;
        canvas.height = p1.h;
        p1.domNode.appendChild(canvas);

        var gl = canvas.getContext("webgl");
        if(gl) {
            return {gl: gl, domNode: canvas};
        }else {
            console.error("get webgl context error");
            return null;
        }

    }

    function createShaderFromStr (gl, type, sourceStr) {
        var shader = gl.createShader(type);

        gl.shaderSource(shader, sourceStr);

        gl.compileShader(shader);

        var compiledStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

        if(compiledStatus) {
            return shader;
        } else {
            console.error(gl.getShaderInfoLog(shader));
            return null;
        }

    }

    function createProgramFromShader (gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        var linkedStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
        if(linkedStatus) {
            return program;
        } else {
            console.error(gl.getProgramInfoLog(program));
            return null
        }
    }

    function initShaderFromStr(gl, vertexSourceStr, fragmentSourceStr) {
        var vertexShader = createShaderFromStr(gl, gl.VERTEX_SHADER, vertexSourceStr);
        var fragmentShader = createShaderFromStr(gl, gl.FRAGMENT_SHADER, fragmentSourceStr);

        if(vertexShader && fragmentShader) {
            var program = createProgramFromShader(gl, vertexShader, fragmentShader);
            if(program) {
                gl.useProgram(program);
                gl.program = program;
                return program;
            } else {
                console.error("create program error")
            }
        } else {
            console.error("create shader error")
        }

    }

    /*
    To do: load shader source from txt
    function getShaderTextSource (url) {
        var http = new XMLHttpRequest();
        http.onreadystatechange = function () {

        }
    }
    */

    global.initCanvas = initCanvas;
    global.initShaderFromStr = initShaderFromStr;

    /* for dom operation */
    function _id (id) {
        return document.getElementById(id);
    }

    global._id = _id;
})(window);
