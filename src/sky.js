import * as THREE from 'three';

export function createSky() {
  // 创建一个大型球体作为天空盒
  const skyGeometry = new THREE.SphereGeometry(10000, 32, 32);
  
  // 天空材质 - 渐变
  const uniforms = {
    topColor: { value: new THREE.Color(0x0077ff) }, // 上方颜色 - 天蓝色
    bottomColor: { value: new THREE.Color(0xffffff) }, // 下方颜色 - 白色
    offset: { value: 400 },
    exponent: { value: 0.6 }
  };
  
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  return sky;
} 