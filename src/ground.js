import * as THREE from 'three';

export function createGround() {
  // 创建一个大型平面作为地面
  const groundGeometry = new THREE.PlaneGeometry(10000, 10000, 20, 20);
  groundGeometry.rotateX(-Math.PI / 2); // 旋转使平面水平
  
  // 地面材质
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x555555,
    shininess: 0,
    flatShading: true
  });
  
  // 创建地面网格
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  
  // 添加一些细节 - 网格纹理
  const gridTexture = createGridTexture();
  gridTexture.wrapS = THREE.RepeatWrapping;
  gridTexture.wrapT = THREE.RepeatWrapping;
  gridTexture.repeat.set(100, 100);
  groundMaterial.map = gridTexture;
  
  return ground;
}

// 创建网格纹理
function createGridTexture() {
  const size = 256;
  const borderSize = 2;
  
  // 创建画布
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  const context = canvas.getContext('2d');
  context.fillStyle = '#4A4A4A';
  context.fillRect(0, 0, size, size);
  
  // 绘制网格线
  context.lineWidth = borderSize;
  context.strokeStyle = '#5A5A5A';
  context.strokeRect(borderSize / 2, borderSize / 2, size - borderSize, size - borderSize);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
} 