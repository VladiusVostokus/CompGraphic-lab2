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

    class Circle {
        constructor(x1, y1, color) {
            this.x1 = x1;
            this.y1 = y1;
            this.circleData = [];
            this.circleData.push(x1, y1, ...color);
        }

        calculateRadius(x2, y2) {
            const xSquare = Math.pow(this.x1 - x2, 2);
            const ySquare = Math.pow(this.y1 - y2, 2);
            const radius = Math.sqrt(xSquare + ySquare)
            return radius;
        }

        addSecondPoint(x2, y2, color) {
            this.circleData.push(x2, y2, ...color);
        }
    }

    let mode = '';
    let pointsCount = 0;
    let trianglePointsCount = 0;
    let circlePointsCount = 0;
    let pointData = [];
    let triangleData = [];
    let startDrawCircle = false;
    let circles = [];
    let circlesCount = 0;
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
        pointData = [];
        triangleData = [];
        circles = [];
        circlesCount = 0;
        pointsCount = 0;
        trianglePointsCount = 0;
        circlePointsCount = 0;
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
    });

    triangleButton.addEventListener('click', () => {
        mode = 't';
    });

    circleButton.addEventListener('click', () => {
        mode = 'c';
    });

    canvas.addEventListener('mousedown', (e) => {
        gl.clear(gl.COLOR_BUFFER_BIT);
        const kx = canvas.width / 2;
        const ky = canvas.height / 2;
        const x = (e.clientX -  kx) / kx;
        const y = -(e.clientY -  ky) / ky;
        const pointColors = hexToZeroOne(pointColorSelector.value);

        if (mode == 'c') {
            if (startDrawCircle) {
                const segments = 10;
                for (let i = 0; i < segments + 1; i++){
                    const angle = (i / segments) * 2 * Math.PI;
                    const circle = circles[circles.length - 1];
                    const radius = circle.calculateRadius(x, y);
                    const actualX2 = circle.x1 + radius * Math.cos(angle);
                    const actualY2 = circle.y1 + radius * Math.sin(angle);
                    circle.addSecondPoint(actualX2, actualY2, pointColors);
                    startDrawCircle = false;
                }
            } 
            else {
                startDrawCircle = true;
                circlePointsCount = 12;
                const circle = new Circle(x,y, pointColors);
                circles.push(circle);
            }
        }

        if (mode == 't') {
            trianglePointsCount++;
            triangleData.push(x);
            triangleData.push(y);
            triangleData.push(...pointColors);
        }

        if (mode == 'p') {
            pointsCount++;
            pointData.push(x);
            pointData.push(y);
            pointData.push(...pointColors);
        }

        const pointBufferData = new Float32Array(pointData);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, pointBufferData, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosition, 2 , gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(aColor, 3 , gl.FLOAT, false, 5 * 4, 2 * 4);

        gl.enableVertexAttribArray(aPosition);
        gl.enableVertexAttribArray(aColor);
        gl.drawArrays(gl.POINTS, 0, pointsCount);

        const trianglesBufferData = new Float32Array(triangleData);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, trianglesBufferData, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosition, 2 , gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(aColor, 3 , gl.FLOAT, false, 5 * 4, 2 * 4);

        gl.drawArrays(gl.TRIANGLES, 0, trianglePointsCount);

        for (const circle of circles) {
            const circlesBufferData = new Float32Array(circle.circleData);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, circlesBufferData, gl.STATIC_DRAW);
            gl.vertexAttribPointer(aPosition, 2 , gl.FLOAT, false, 5 * 4, 0);
            gl.vertexAttribPointer(aColor, 3 , gl.FLOAT, false, 5 * 4, 2 * 4);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, circlePointsCount);
        }
    });
}