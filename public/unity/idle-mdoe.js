// Simple WebGL animation
const canvas = document.getElementById('webglCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

if (gl) {
    // Vertex shader
    const vertexShaderSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Fragment shader with animation
    const fragmentShaderSource = `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;
        
        void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            float wave = sin(uv.x * 10.0 + time) * 0.5 + 0.5;
            vec3 color = vec3(uv.x, wave, uv.y);
            gl_FragColor = vec4(color, 0.3);
        }
    `;

    // Create shaders
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Set up geometry
    const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    // Animation loop
    let startTime = Date.now();
    function animate() {
        const time = (Date.now() - startTime) * 0.001;
        
        gl.uniform1f(timeLocation, time);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(animate);
    }
    animate();
}

console.log('Idle mode WebGL loaded successfully!');