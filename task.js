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

    class Point {
        static pointsCount = 0;
        static pointsData = [];
        static addPoint(x, y, color) {
            this.pointsData.push(x, y, ...color);
        }
    }

    class Triangle {
        static trianglesPointsCount = 0;
        static trianglesData = [];
        static addTrianglePoint(x, y, color) {
            this.trianglesData.push(x, y, ...color);
        }
    }

    class Circle {
        static isDraw = false;
        static segments = 15;
        static pointsCount = this.segments + 2;
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

    const bgColorSelector = document.getElementById('bg');
    const pointColorSelector = document.getElementById('color');
    const clearButton = document.getElementById('clear');
    const pointButton = document.getElementById('point');
    const triangleButton = document.getElementById('triangle');
    const circleButton = document.getElementById('circle');
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const aColor = gl.getAttribLocation(program,'aColor');
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.enableVertexAttribArray(aColor);
    
    const buffer = gl.createBuffer();

    let mode = '';
    let circles = [];

    const hexToZeroOne = (hex) => {
        let hexValue = hex.replace('#', '');
        let r = parseInt(hexValue.substring(0, 2), 16) / 255;
        let g = parseInt(hexValue.substring(2, 4), 16) / 255;
        let b = parseInt(hexValue.substring(4, 6), 16) / 255;
        return [r, g, b];
    }

    const clearCanvas = (bgHex) => {
        const color = hexToZeroOne(bgHex);
        gl.clearColor(...color, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        Point.pointsData = [];
        Point.pointsCount = 0;
        Triangle.trianglesData = [];
        Triangle.trianglesPointsCount = 0;
        circles = [];
    }

    const bindShapeData = (buffer, shapeData) => {
        const bufferShapeData = new Float32Array(shapeData)
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, bufferShapeData, gl.STATIC_DRAW);
        gl.vertexAttribPointer(aPosition, 2 , gl.FLOAT, false, 5 * 4, 0);
        gl.vertexAttribPointer(aColor, 3 , gl.FLOAT, false, 5 * 4, 2 * 4);
    }

    clearCanvas(bgColorSelector.value);

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

    const modes = {
        p: (x, y, color) => {
            Point.pointsCount++;
            Point.addPoint(x, y, color);
        },
        t: (x, y, color) => {
            Triangle.trianglesPointsCount++;
            Triangle.addTrianglePoint(x ,y, color);
        },
        c: (x, y, color) => {
            if (Circle.isDraw) {
                for (let i = 0; i < Circle.segments + 1; i++) {
                    const angle = (i / Circle.segments) * 2 * Math.PI;
                    const circle = circles[circles.length - 1];
                    const radius = circle.calculateRadius(x, y);
                    const actualX2 = circle.x1 + radius * Math.cos(angle);
                    const actualY2 = circle.y1 + radius * Math.sin(angle);
                    circle.addSecondPoint(actualX2, actualY2, color);
                    Circle.isDraw = false;
                }
            } 
            else {
                Circle.isDraw = true;
                const circle = new Circle(x,y, color);
                circles.push(circle);
            }
        },
    }

    const action = (drawingMode, x ,y, color) => modes[drawingMode](x, y, color) || (() => {});

    canvas.addEventListener('mousedown', (e) => {
        gl.clear(gl.COLOR_BUFFER_BIT);
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / canvas.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / canvas.height) * 2 + 1;
        const pointColor = hexToZeroOne(pointColorSelector.value);

        action(mode, x, y, pointColor);

        bindShapeData(buffer, Point.pointsData);
        gl.drawArrays(gl.POINTS, 0, Point.pointsCount);

        bindShapeData(buffer, Triangle.trianglesData);
        gl.drawArrays(gl.TRIANGLES, 0, Triangle.trianglesPointsCount);

        for (const circle of circles) {
            bindShapeData(buffer, circle.circleData)
            gl.drawArrays(gl.TRIANGLE_FAN, 0, Circle.pointsCount);
        }
    });
}