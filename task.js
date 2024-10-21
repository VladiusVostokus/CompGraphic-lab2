'use strict';

const vsSource = `#version 300 es
in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 5.0;
}`;

const fsSource = `#version 300 es
precision mediump float;

uniform vec3 uColor;
out vec4 fragColor;

void main() {
    fragColor = vec4(uColor, 1.0);
}`;

function main() {
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        console.log("Failde to get context for WebGL");
        return;
    }

    const program = gl.createProgram();
    const vsShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsShader, vsSource);
    gl.compileShader(vsShader);
    gl.attachShader(program, vsShader);

    const fsShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsShader, fsSource);
    gl.compileShader(fsShader);
    gl.attachShader(program, fsShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vsShader));
        console.log(gl.getShaderInfoLog(fsShader));
    }

    clearCanvas();
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const uColor = gl.getUniformLocation(program,'uColor');
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const positions = [];
    const buffer = gl.createBuffer();

    function clearCanvas() {
        gl.clearColor(0.5, 0.2, 0.6, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    let mode = '';
    let pointsCount = 0;

    const clearButton = document.getElementById('clear');
    const pointButton = document.getElementById('point');
    const triangleButton = document.getElementById('triangle');
    const circleButton = document.getElementById('circle');
    clearButton.addEventListener('click', () => {
        clearCanvas();
    });

    pointButton.addEventListener('click', () => {
        mode = 'p';
        console.log(mode);
    });

    triangleButton.addEventListener('click', () => {
        mode = 't';
        console.log(mode);
    });

    circleButton.addEventListener('click', () => {
        mode = 'c';
        console.log(mode);
    });

    canvas.addEventListener('mousedown', (e) => {
        pointsCount++;
        const kx = canvas.width / 2;
        const ky = canvas.height / 2;
        const x = (e.clientX -  kx) / kx;
        const y = -(e.clientY -  ky) / ky;
        positions.push(x);
        positions.push(y);

        const bufferData = new Float32Array(positions)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosition, 2 , gl.FLOAT, false, 2 * 4, 0);

        gl.enableVertexAttribArray(aPosition);
        gl.uniform3f(uColor, 1.0, 0.0, 0.0);
        gl.drawArrays(gl.POINTS, 0, pointsCount);
    });
}