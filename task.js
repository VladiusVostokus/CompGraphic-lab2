'use strict';

const vsSource = `#version 300 es
in vec2 aPosition;
in vec3 aColor;
out vec3 vColor;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = 5.0;
    vColor = aColor;
}`;

const fsSource = `#version 300 es
precision mediump float;

in vec3 vColor;
out vec4 fragColor;

void main() {
    fragColor = vec4(vColor, 1.0);
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

    let mode = '';
    let pointsCount = 0;
    let positions = [];
    const bgColorSelector = document.getElementById('bg');
    const pointColorSelector = document.getElementById('color');
    clearCanvas(bgColorSelector.value);
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const aColor = gl.getAttribLocation(program,'aColor');
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const buffer = gl.createBuffer();

    function hexToZeroOne(hex) {
        let hexValue = hex.replace('#', '');
        let r = parseInt(hexValue.substring(0, 2), 16) / 255;
        let g = parseInt(hexValue.substring(2, 4), 16) / 255;
        let b = parseInt(hexValue.substring(4, 6), 16) / 255;
        return [r, g, b];
    }

    function clearCanvas(bgHex) {
        const color = hexToZeroOne(bgHex);
        gl.clearColor(...color, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        positions = [];
        pointsCount = 0;
    }

    const clearButton = document.getElementById('clear');
    const pointButton = document.getElementById('point');
    const triangleButton = document.getElementById('triangle');
    const circleButton = document.getElementById('circle');
    clearButton.addEventListener('click', () => {
        clearCanvas(bgColorSelector.value);
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
        gl.clear(gl.COLOR_BUFFER_BIT);
        pointsCount++;
        const kx = canvas.width / 2;
        const ky = canvas.height / 2;
        const x = (e.clientX -  kx) / kx;
        const y = -(e.clientY -  ky) / ky;
        const pointColors = hexToZeroOne(pointColorSelector.value);
        positions.push(x);
        positions.push(y);
        positions.push(...pointColors);

        const bufferData = new Float32Array(positions)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosition, 2 , gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(aColor, 3 , gl.FLOAT, false, 5 * 4, 2 * 4);

        gl.enableVertexAttribArray(aPosition);
        gl.enableVertexAttribArray(aColor);
        gl.drawArrays(gl.POINTS, 0, pointsCount);
    });
}