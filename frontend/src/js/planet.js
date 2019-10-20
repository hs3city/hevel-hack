const vertexShaderSource = `// an attribute will receive data from a buffer
attribute vec4 a_position;

// all shaders have a main function
void main() {

    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = a_position;
}
   `
const fragmentShaderSource = `#ifdef GL_ES
precision highp float;
#endif

uniform int cities;
uniform float time;
uniform float left;
uniform float top;
uniform vec2 resolution;
uniform float angle;
uniform float rotspeed;
uniform float light;
uniform float zLight;

uniform float modValue;

uniform vec2 noiseOffset;
uniform vec2 noiseScale;
uniform vec2 noiseScale2;
uniform vec2 noiseScale3;
uniform vec2 cloudNoise;

uniform float cloudiness;

uniform float waterLevel;
uniform float rivers;
uniform float temperature;

uniform vec3 ocean;
uniform vec3 ice;
uniform vec3 cold;
uniform vec3 temperate;
uniform vec3 warm;
uniform vec3 hot;
uniform vec3 speckle;
uniform vec3 clouds;
uniform vec3 haze;
uniform vec3 lightColor;

//
// GLSL textureless classic 2D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-08-22
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec4 mod289(vec4 x)
{
return x - floor(x * (1.0 / modValue)) * modValue;
}

vec4 permute(vec4 x)
{
return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
return 1.79284291400159 - 0.85373472095314 * r;
}

vec2 fade(vec2 t) {
return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise, periodic variant
float pnoise(vec2 P, vec2 rep)
{
vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
Pi = mod(Pi, rep.xyxy); // To create noise with explicit period
Pi = mod289(Pi);        // To avoid truncation effects in permutation
vec4 ix = Pi.xzxz;
vec4 iy = Pi.yyww;
vec4 fx = Pf.xzxz;
vec4 fy = Pf.yyww;

vec4 i = permute(permute(ix) + iy);

vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
vec4 gy = abs(gx) - 0.5 ;
vec4 tx = floor(gx + 0.5);
gx = gx - tx;

vec2 g00 = vec2(gx.x,gy.x);
vec2 g10 = vec2(gx.y,gy.y);
vec2 g01 = vec2(gx.z,gy.z);
vec2 g11 = vec2(gx.w,gy.w);

vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
g00 *= norm.x;  
g01 *= norm.y;  
g10 *= norm.z;  
g11 *= norm.w;  

float n00 = dot(g00, vec2(fx.x, fy.x));
float n10 = dot(g10, vec2(fx.y, fy.y));
float n01 = dot(g01, vec2(fx.z, fy.z));
float n11 = dot(g11, vec2(fx.w, fy.w));

vec2 fade_xy = fade(Pf.xy);
vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
return 2.3 * n_xy;
}

float spow(float x, float y) { float s = sign(x); return s * pow(s * x, y); }

vec4 planet(in vec2 pix) {
vec2 p = -1.0 + 2.0 * pix;
p.x *= resolution.x / resolution.y;
float rot = time * rotspeed;
p = mat2(cos(angle), sin(angle), -sin(angle), cos(angle)) * p;

vec3 ro = vec3( 0.0, 0.0, 2.25 );
vec3 rd = normalize( vec3( p, -2.0 ) );

vec3 col = vec3(0.0);

// intersect sphere
float b = dot(ro,rd);
float c = dot(ro,ro) - 1.0;
float h = b*b - c;
float t = -b - sqrt(h);
vec3 pos = ro + t*rd;
vec3 nor = pos;

// texture mapping
vec2 uv;
uv.x = atan(nor.x,nor.z)/6.2831 + rot;
uv.y = acos(nor.y)/3.1416;
uv.y = 0.5 + spow(uv.y - 0.5, 1.2);
uv += noiseOffset;

float n2 = pnoise(uv * noiseScale2, noiseScale2) * 0.05;
float n = pnoise(uv * noiseScale, noiseScale) + n2;
float n3 = pnoise(uv * noiseScale3, noiseScale3);

float temp = cos(nor.y * 4.0) + n3 * 0.8 + n * 0.5 + temperature;

float oceanity = min(1.0, 1.0 - smoothstep(0.19, 0.2, n - waterLevel) + rivers * (1.0 - smoothstep(0.01, 0.04, mod(temp - uv.x * 35.0 + 0.3, 1.0) + n * n * 0.35))) * smoothstep(-0.9, -0.75, temp);

float iceity = max(0.0, 1.0 + waterLevel - oceanity - smoothstep(-0.8, -0.6, temp));
float specklity = max(0.0, step(0.009, n2 * n3) - iceity - oceanity);
float coldity = max(0.0, 1.0 - iceity - oceanity - specklity - smoothstep(-0.4, 0.0, temp));
float temperateity = max(0.0, 1.0 - iceity - coldity - oceanity - specklity - smoothstep(0.3, 0.8, temp));
float warmity = max(0.0, 1.0 - iceity - coldity - temperateity - oceanity - specklity - smoothstep(1.05, 1.3, temp));
float hottity = max(0.0, 1.0 - oceanity - iceity - coldity - temperateity - warmity - specklity);

col = ocean * oceanity + ice * iceity + cold * coldity + temperate * temperateity + warm * warmity + hot * hottity + speckle * specklity;

col *= (0.7 + abs(temp + n * 0.2) * 0.3);
col *= 0.92 + step(0.1, mod(n2, 0.4)) * 0.08;
col *= 1.0 + step(0.39, mod(n + uv.x, 0.4)) * 0.1;

float cloudN = max(0.0, pnoise((uv + vec2(rotspeed * time, 0)) * cloudNoise, cloudNoise) + cloudiness + n2);
col = col * (1.0 - cloudN) + clouds * cloudN;

float lighting = max(sin(light) * nor.y * 2.0 + cos(light) * nor.x * 2.0 + nor.z * zLight,0.0);
col = col * 0.2 + col * lightColor * lighting * 0.8;

if (
    cities == 1 &&
    lighting <= 0.8 &&
    (n > 0.05 && n < 0.2 ||// Next to the water
    mod(uv.x * uv.y + n / 10.0, 1.0) < 0.1)
)
{
    col += vec3(1.0, 1.0, 0.7) * (1.0 - smoothstep(0.4, 0.8, lighting)) * (max(0.7, pnoise(uv * vec2(122.0, 122.0), vec2(122.0, 122.0))) - 0.7) * 3.0;
}

//return vec4(col, smoothstep(0.0, 8.0 / resolution.x, h));
return vec4(clamp(col, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0)) * smoothstep(0.0, 8.0 / resolution.x, h) + haze * smoothstep(0.0, 30.0 / resolution.x, h + 0.1), smoothstep(0.0, 8.0 / resolution.x, h + 0.2));
}

void main(void)
{
vec3 coord = vec3(gl_FragCoord);
coord.x += left;
coord.y += top;

gl_FragColor = planet(coord.xy / resolution.xy), 1.0;
}`

// var canvas = document.getElementById("planet-view");
var structs = {};
var slots = {};

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function resize(canvas) {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  if (canvas.width != displayWidth ||
    canvas.height != displayHeight) {

    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}


var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
var t = new Date().getTime() % 1000000;

// function nextFrame() {
//   t = new Date().getTime() % 1000000;
//   renderPlanet();
//   requestAnimationFrame(nextFrame);
// }

// // Once everything is set up, start game loop.
// requestAnimationFrame(nextFrame);

function doParse(text) {
  var struct = null;
  var value = null;
  console.log("parsing");
  text.split("\n").forEach(function (line) {
    var k = line.split(" ")[0];
    var v = line.substring(k.length + 1);
    if (k.length == 0 || v.length == 0) {
      return;
    }
    if (k == "struct") {
      value = null;
      struct = {
        slots: [],
        vals: {}
      };
      structs[v] = struct;
      return;
    }
    if (k == "slot") {
      struct.slots.push(v);
      if (!slots[v]) {
        slots[v] = [];
      }
      return;
    }
    if (k == "blocker") {
      value.blockers.push([v.split(" ")[0], v.split(" ")[1]]);
      return;
    }
    if (slots[k]) {
      struct = null;
      value = {
        "id": v,
        "blockers": []
      };
      slots[k].push(value);
      return;
    }
    if (struct) {
      struct.vals[k] = v;
    } else {
      value[k] = v;
    }
  });
  console.log(structs);
  console.log(slots);
}

function doGen(structID) {
  // we always gen planaet
  console.log(structID);

  var result = {
    "struct": structs[structID]
  };
  // we lay down template for generator
  // for each slot 
  console.log(result);
  structs[structID].slots.forEach(function (slot) {
    var availableSlots = slots[slot].filter(function (value) {
      return !value.blockers.some(function (blocker) {
        var blockerSlot = blocker[0];
        if (blockerSlot.indexOf(":") != -1) {
          var blockerKey = blockerSlot.substring(blockerSlot.indexOf(":") + 1);
          blockerSlot = blockerSlot.split(":")[0];
          var blockerValue = blocker[1];
          return result[blockerSlot] && result[blockerSlot][blockerKey] == blockerValue;
        } else {
          var blockerID = blocker[1];
          return result[blockerSlot] && result[blockerSlot].id == blockerID;
        }
      });
    });
    if (availableSlots.length == 0) {
      console.log(slot + " fail");
      console.log(result);
      availableSlots = slots[slot]; // qqDPS
    }
    result[slot] = availableSlots[Math.floor(Math.random() * availableSlots.length)];
  });
  console.log(result);
  return result;
}

function doDisplay(result) {
  console.log("Displaying");
  jQuery("body").css("background-position", Math.ceil(Math.random() * 2000) + "px " + Math.ceil(Math.random() * 2000) + "px");
  jQuery("#c").
  css("top", (jQuery(window).innerHeight() / 2 - jQuery("#c").height() / 2) + "px").
  css("left", (jQuery(window).innerWidth() / 2 - jQuery("#c").width() / 2) + "px");
  jQuery("#txt").html(doExpand(result.struct.vals["desc"], result));
  jQuery("#stats").html(
    "Habitability: " + (Math.max(1, Math.min(9, eval(doExpand(result.struct.vals["hab"], result)))) * 10) + "%<br>" +
    "Size: " + (Math.max(1, Math.min(9, eval(doExpand(result.struct.vals["sze"], result))))) + "<br>" +
    "Industry: " + (Math.max(1, Math.min(9, eval(doExpand(result.struct.vals["min"], result))))) + "<br>" +
    "Science: " + (Math.max(1, Math.min(9, eval(doExpand(result.struct.vals["sci"], result)))))
  );
  data.vWaterLevel = eval(doExpand(result.struct.vals["watL"], result));
  data.vTemperature = eval(doExpand(result.struct.vals["temp"], result));
  data.vRivers = eval(doExpand(result.struct.vals["rive"], result));
  data.vCold = eval(doExpand(result.struct.vals["coldC"], result));
  data.vOcean = eval(doExpand(result.struct.vals["oceanC"], result)) || [0.05, 0.22, 0.38];
  data.vTemperate = eval(doExpand(result.struct.vals["temperateC"], result));
  data.vWarm = eval(doExpand(result.struct.vals["warmC"], result));
  data.vHot = eval(doExpand(result.struct.vals["hotC"], result));
  data.vSpeckle = eval(doExpand(result.struct.vals["speckleC"], result));
  data.vLightColor = eval(doExpand(result.struct.vals["lightC"], result));
  data.vHaze = eval(doExpand(result.struct.vals["hazeC"], result)) || [0.15, 0.15, 0.2];

  data.vCloudiness = Math.min(1.5, Math.max(0, eval(doExpand(result.struct.vals["clouds"], result))));
  data.vClouds = eval(doExpand(result.struct.vals["cloudC"], result)) || [0.9, 0.9, 0.9];
  data.vAngle = 0.6 * Math.random();
  data.vRotspeed = (0.005 + Math.random() * 0.01) * (Math.random() < 0.3 ? -1 : 1) * eval(doExpand(result.struct.vals["rotspeedMult"], result));;
  data.vLight = 4 * Math.random();
  data.vZLight = 0.2 + Math.random();
  data.vModValue = 17 + Math.ceil(Math.random() * 20);
  data.vNoiseOffset = [Math.ceil(Math.random() * 100), Math.ceil(Math.random() * 100)];
  data.vNoiseScale = [7 + Math.ceil(Math.random() * 10), 5 + Math.ceil(Math.random() * 7)];
  var sc = 80 + Math.ceil(Math.random() * 220);
  data.vNoiseScale2 = [sc, sc];
  sc = 20 + Math.ceil(Math.random() * 80);
  data.vNoiseScale3 = [sc, sc];
  data.vCloudNoise = [4 + Math.ceil(Math.random() * 9), 20 + Math.ceil(Math.random() * 20)];
}

function doExpand(txt, context) {
  if (!txt) {
    return "";
  }
  if (txt.indexOf("{") == -1) {
    return txt;
  }
  return txt.replace(/[{]([^}]*)[}]/g, function (m, capture) {
    if (capture.indexOf(":") == -1) {
      return context[capture].id;
    } else {
      var slot = capture.split(":")[0];
      var prop = capture.substring(slot.length + 1);
      return doExpand(context[slot][prop], context);
    }
  });
}

fetch('./assets/structs.json')
  .then(response => {
    return response.json()
  })
  .then(data => {
    // Work with JSON data here
    structs = data
    console.log(data)
  })
  .catch(err => {
    // Do something for an error here
    console.log(err);
  })

fetch('./assets/slots.json')
  .then(response => {
    return response.json()
  })
  .then(data => {
    // Work with JSON data here
    slots = data
    console.log(data)

    doDisplay(doGen("planet"));
  })
  .catch(err => {
    // Do something for an error here
    console.log(err);
  })



Vue.component("planet-render", {
  props: ['planetParams'],

  data: function () {

    return {
      t: new Date().getTime() % 1000000,

      // planetParams: this.planetParams,
    }
  },
  methods: {
    buildShaders () {
      let _gl = this.$refs.canvas.getContext("webgl");
      this.gl = _gl;
      this.vertexShader = createShader(_gl, _gl.VERTEX_SHADER, vertexShaderSource);
      this.fragmentShader = createShader(_gl, _gl.FRAGMENT_SHADER, fragmentShaderSource);
      this.program = createProgram(_gl, this.vertexShader, this.fragmentShader);
      this.positionAttributeLocation = _gl.getAttribLocation(this.program, "a_position");
    },

    getUniformLocation(v) {
      return this.gl.getUniformLocation(this.program, v);
    },

    getAllUniformLocations () {
      this.uCities = this.getUniformLocation("cities")
      this.uTime = this.getUniformLocation("time")
      this.uLeft = this.getUniformLocation("left")
      this.uTop = this.getUniformLocation("top")
      this.uResolution = this.getUniformLocation("resolution")
      this.uAngle = this.getUniformLocation("angle")
      this.uRotspeed = this.getUniformLocation("rotspeed")
      this.uLight = this.getUniformLocation("light")
      this.uZLight = this.getUniformLocation("zLight")
      this.uLightColor = this.getUniformLocation("lightColor")
      this.uModValue = this.getUniformLocation("modValue")
      this.uNoiseOffset = this.getUniformLocation("noiseOffset")
      this.uNoiseScale = this.getUniformLocation("noiseScale")
      this.uNoiseScale2 = this.getUniformLocation("noiseScale2")
      this.uNoiseScale3 = this.getUniformLocation("noiseScale3")
      this.uCloudNoise = this.getUniformLocation("cloudNoise")
      this.uCloudiness = this.getUniformLocation("cloudiness")
      this.uOcean = this.getUniformLocation("ocean")
      this.uIce = this.getUniformLocation("ice")
      this.uCold = this.getUniformLocation("cold")
      this.uTemperate = this.getUniformLocation("temperate")
      this.uWarm = this.getUniformLocation("warm")
      this.uHot = this.getUniformLocation("hot")
      this.uSpeckle = this.getUniformLocation("speckle")
      this.uClouds = this.getUniformLocation("clouds")
      this.uWaterLevel = this.getUniformLocation("waterLevel")
      this.uRivers = this.getUniformLocation("rivers")
      this.uTemperature = this.getUniformLocation("temperature")
      this.uHaze = this.getUniformLocation("haze")

      this.positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      // three 2d points
      this.positions = [
        -1, -1,
        -1, 1,
        1, 1,
        -1, -1,
        1, 1,
        1, -1
      ];
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
    },

    renderPlanet() {
      let gl = this.gl
      resize(gl.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // Tell it to use our program (pair of shaders)
      gl.useProgram(this.program);
      gl.enableVertexAttribArray(this.positionAttributeLocation);
      // Bind the position buffer.
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    
      // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
      var size = 2; // 2 components per iteration
      var type = gl.FLOAT; // the data is 32bit floats
      var normalize = false; // don't normalize the data
      var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      var offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(
        this.positionAttributeLocation, size, type, normalize, stride, offset)

      planetRadius = 380 / (1 + Math.exp(this.radius/100)) + 190;
      console.log()
      gl.uniform1i(this.uCities, 0);
      gl.uniform1f(this.uTime, this.$data.t * 0.001); // qqDPS
      gl.uniform1f(this.uLeft, - (400 - planetRadius)/2);
      gl.uniform1f(this.uTop, - (400 - planetRadius)/2);
      gl.uniform2f(this.uResolution, 380, 380);
      gl.uniform1f(this.uAngle, this.planetParams.vAngle);
      gl.uniform1f(this.uRotspeed, this.planetParams.vRotspeed);
      gl.uniform1f(this.uLight, this.planetParams.vLight);
      gl.uniform1f(this.uZLight, this.planetParams.vZLight);
      gl.uniform3fv(this.uLightColor, this.planetParams.vLightColor);
      gl.uniform1f(this.uModValue, this.planetParams.vModValue);
      gl.uniform2fv(this.uNoiseOffset, this.planetParams.vNoiseOffset);
      gl.uniform2fv(this.uNoiseScale, this.planetParams.vNoiseScale);
      gl.uniform2fv(this.uNoiseScale2, this.planetParams.vNoiseScale2);
      gl.uniform2fv(this.uNoiseScale3, this.planetParams.vNoiseScale3);
      gl.uniform2fv(this.uCloudNoise, this.planetParams.vCloudNoise);
      gl.uniform1f(this.uCloudiness, this.planetParams.vCloudiness);
      gl.uniform3fv(this.uOcean, this.planetParams.vOcean);
      gl.uniform3f(this.uIce, 250 / 255.0, 250 / 255.0, 250 / 255.0);
      gl.uniform3fv(this.uCold, this.planetParams.vCold); //53/255.0, 102/255.0, 100/255.0);
      gl.uniform3fv(this.uTemperate, this.planetParams.vTemperate); //79/255.0, 109/255.0, 68/255.0);
      gl.uniform3fv(this.uWarm, this.planetParams.vWarm); //119/255.0, 141/255.0, 82/255.0);
      gl.uniform3fv(this.uHot, this.planetParams.vHot); //223/255.0, 193/255.0, 148/255.0);
      gl.uniform3fv(this.uSpeckle, this.planetParams.vSpeckle);
      gl.uniform3fv(this.uClouds, this.planetParams.vClouds);
      gl.uniform3fv(this.uHaze, this.planetParams.vHaze);
      gl.uniform1f(this.uWaterLevel, this.planetParams.vWaterLevel);
      gl.uniform1f(this.uRivers, this.planetParams.vRivers);
      gl.uniform1f(this.uTemperature, this.planetParams.vTemperature);
    
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
      console.log("rendered")
    },

    _nextFrame() {
      this.t = new Date().getTime() % 1000000;
      this.renderPlanet();
      requestAnimationFrame(this._nextFrame);
    }
  },
  mounted: function () {
    // console.log(this.$refs.canvas);
    this.buildShaders();
    this.getAllUniformLocations();
    console.log(this.$data);

    this.renderPlanet();
       
    // Once everything is set up, start game loop.
    requestAnimationFrame(this._nextFrame);
  },
  template: '<canvas ref="canvas" class="planet-view"></canvas>',
})




// jQuery.ajax({
//     url: "data.txt?" + (new Date()).getTime(),
//     success: function(txt) { doParse(txt); doDisplay(doGen("planet")); }
// });