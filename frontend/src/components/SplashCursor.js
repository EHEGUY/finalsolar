import { useEffect, useRef } from 'react';

const SplashCursor = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // ---- Shader Sources ----
    const vertexShaderSrc = `
      attribute vec2 aPosition;
      varying vec2 vUv;
      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const splatFragmentShaderSrc = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 uCenter;
      uniform float uRadius;
      uniform vec3 uColor;

      void main() {
        float d = distance(vUv, uCenter);
        float alpha = 1.0 - smoothstep(0.0, uRadius, d);
        gl_FragColor = vec4(uColor, alpha);
      }
    `;

    // ---- Shader/Program Helpers ----
    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    function createProgram(vsSource, fsSource) {
      const program = gl.createProgram();
      gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
      gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
      }
      return program;
    }

    // ---- Buffers ----
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    // ---- Splat Program ----
    const splatProgram = createProgram(vertexShaderSrc, splatFragmentShaderSrc);
    const splatPosLoc = gl.getAttribLocation(splatProgram, 'aPosition');
    const uCenter = gl.getUniformLocation(splatProgram, 'uCenter');
    const uRadius = gl.getUniformLocation(splatProgram, 'uRadius');
    const uColor = gl.getUniformLocation(splatProgram, 'uColor');

    // ---- Mouse + Hue ----
    let mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5 };
    let hue = 0;

    function hslToRgb(h, s, l) {
      let r, g, b;
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = l * (1 - s);
      const q = l * (1 - f * s);
      const t = l * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = l; g = t; b = p; break;
        case 1: r = q; g = l; b = p; break;
        case 2: r = p; g = l; b = t; break;
        case 3: r = p; g = q; b = l; break;
        case 4: r = t; g = p; b = l; break;
        case 5: r = l; g = p; b = q; break;
      }
      return [r, g, b];
    }

    function splat(x, y, radius, color) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(splatProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.enableVertexAttribArray(splatPosLoc);
      gl.vertexAttribPointer(splatPosLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uCenter, x, y);
      gl.uniform1f(uRadius, radius);
      gl.uniform3f(uColor, color[0], color[1], color[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    window.addEventListener('mousemove', e => {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
      const dx = mouse.x - mouse.px;
      const dy = mouse.y - mouse.py;
      const speed = Math.min(Math.sqrt(dx * dx + dy * dy) * 50, 0.05);

      hue = (hue + 2) % 360;
      const rgb = hslToRgb(hue / 360, 1, 0.5);

      splat(mouse.x, mouse.y, 0.05 + speed, rgb);
    });

    function draw() {
      gl.clearColor(0, 0, 0, 0); // transparent clear
      gl.clear(gl.COLOR_BUFFER_BIT);
      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'transparent'
      }}
    />
  );
};

export default SplashCursor;
