// Living mesh gradient behind the whole site.
// Domain-warped noise mixes the warm palette; a soft glow trails the cursor.
// Falls back to the CSS blobs if WebGL is unavailable.
(() => {
  const canvas = document.querySelector(".mesh");
  const gl = canvas && canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
  if (!gl) return;
  document.documentElement.classList.add("has-mesh");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const vert = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const frag = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uMouseOn;

    // palette
    const vec3 cream   = vec3(1.000, 1.000, 1.000);
    const vec3 butter  = vec3(0.900, 0.940, 1.000);   // soft blues for light mode
    const vec3 peach   = vec3(0.780, 0.860, 0.980);
    const vec3 caramel = vec3(0.700, 0.800, 0.960);
    const vec3 blush   = vec3(0.820, 0.880, 1.000);

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
                 mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      float aspect = uRes.x / uRes.y;
      vec2 p = vec2(uv.x * aspect, uv.y) * 0.62;
      float t = uTime;

      // flow pulls gently toward the cursor
      vec2 m = vec2(uMouse.x * aspect, uMouse.y) * 0.62;
      vec2 toM = m - p;
      p += toM * 0.18 * uMouseOn * exp(-dot(toM, toM) * 6.0);

      // big, slow liquid folds: low frequency + light domain warp
      vec2 q = vec2(fbm(p + vec2(0.0, t * 0.16)), fbm(p + vec2(5.2, -t * 0.13)));
      vec2 r = vec2(fbm(p + 1.7 * q + vec2(1.7, 9.2) + t * 0.10),
                    fbm(p + 1.7 * q + vec2(8.3, 2.8) - t * 0.09));
      float f = fbm(p + 1.4 * r);

      vec3 col = mix(butter, peach, smoothstep(-0.22, 0.18, f));
      col = mix(col, blush,   smoothstep(-0.12, 0.22, r.x - q.y) * 0.8);
      col = mix(col, caramel, smoothstep(0.02, 0.32, q.x + r.y) * 0.5);
      col = mix(col, cream,   smoothstep(0.0, 0.3, r.y * 0.6 - f) * 0.75);

      // light page, but the colour reads clearly (client: the gradient felt too faint at 80% white)
      col = mix(col, vec3(1.0, 1.0, 1.0), 0.5);
      // light mode: pure white page, the blue only as soft clouds (lift everything pale back to white)
      col = mix(vec3(1.0), col, smoothstep(0.045, 0.13, 1.0 - min(col.r, min(col.g, col.b))));

      // keep the headline zone airy so cocoa type stays readable
      vec2 c = (uv - vec2(0.5, 0.74)) * vec2(aspect * 0.9, 1.6);
      col = mix(col, vec3(1.0, 0.992, 0.984), 0.45 * exp(-dot(c, c) * 2.6));

      // warm glow trailing the cursor
      vec2 d = (uv - uMouse) * vec2(aspect, 1.0);
      col = mix(col, blush, 0.22 * uMouseOn * exp(-dot(d, d) * 9.0));

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn("mesh gradient disabled:", err);
    document.documentElement.classList.remove("has-mesh");
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");
  const uMouseOn = gl.getUniformLocation(prog, "uMouseOn");

  // the gradient is soft, so half resolution looks identical and costs a quarter
  const SCALE = 0.5;
  function resize() {
    canvas.width = Math.max(2, Math.round(innerWidth * SCALE));
    canvas.height = Math.max(2, Math.round(innerHeight * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  addEventListener("resize", resize);
  resize();

  const mouse = { x: 0.5, y: 0.6, tx: 0.5, ty: 0.6, on: 0, ton: 0 };
  addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / innerWidth;
    mouse.ty = 1 - e.clientY / innerHeight;
    mouse.ton = 1;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { mouse.ton = 0; });

  const start = performance.now();
  function frame(now) {
    // dark mode shows the denim instead, so the gradient sleeps
    if ((window.KA && KA.bgPaused) || document.documentElement.dataset.theme === 'dark') { requestAnimationFrame(frame); return; }
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    mouse.on += (mouse.ton - mouse.on) * 0.04;
    gl.uniform1f(uTime, reduce ? 12.0 : (now - start) / 1000 + 12.0);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uMouseOn, mouse.on);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
