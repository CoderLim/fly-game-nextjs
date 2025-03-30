import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

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
  
  // 添加欢迎广告牌
  const billboard = createWelcomeBillboard("Welcome XX");
  ground.add(billboard);
  
  // 添加空中立体文字
  create3DText("Hello World", ground);
  
  return ground;
}

// 创建空中3D立体文字
function create3DText(text, parent) {
  // 创建一个临时的对象作为文字的容器
  const textGroup = new THREE.Group();
  parent.add(textGroup);
  
  // 异步加载字体
  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
    // 文字几何体设置
    const textGeometry = new TextGeometry(text, {
      font: font,
      size: 30,              // 字体大小
      height: 10,            // 文字厚度
      curveSegments: 12,     // 曲线分段数
      bevelEnabled: true,    // 启用斜角
      bevelThickness: 2,     // 斜角厚度
      bevelSize: 1.5,        // 斜角大小
      bevelOffset: 0,        // 斜角偏移
      bevelSegments: 5       // 斜角分段数
    });
    
    // 计算几何体中心并调整位置
    textGeometry.computeBoundingBox();
    const centerOffset = -(textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x) / 2;
    
    // 创建彩虹渐变材质
    const textMaterials = [
      new THREE.MeshPhongMaterial({ color: 0xff5555, shininess: 100, specular: 0xffffff }), // 红色面
      new THREE.MeshPhongMaterial({ color: 0xffdd55, shininess: 100, specular: 0xffffff })  // 金色边
    ];
    
    // 创建3D文字网格
    const textMesh = new THREE.Mesh(textGeometry, textMaterials);
    
    // 设置文字位置 - 空中300单位，前方400单位
    textMesh.position.set(centerOffset, 300, -400);
    
    // 稍微倾斜文字使其更易于从下方看到
    textMesh.rotation.x = -Math.PI / 10;
    
    // 添加特效 - 发光轮廓
    const textOutline = new THREE.Mesh(
      textGeometry.clone(),
      new THREE.MeshBasicMaterial({ 
        color: 0x0088ff,
        transparent: true,
        opacity: 0.5,
        wireframe: true
      })
    );
    textOutline.position.copy(textMesh.position);
    textOutline.rotation.copy(textMesh.rotation);
    textOutline.scale.multiplyScalar(1.02);
    
    // 添加到场景
    textGroup.add(textMesh);
    textGroup.add(textOutline);
    
    // 添加动画效果 - 在update函数中使用
    textGroup.userData.animate = (time) => {
      // 使文字缓慢浮动
      textGroup.position.y = Math.sin(time * 0.001) * 10;
      // 使文字轻微旋转
      textGroup.rotation.y = Math.sin(time * 0.0005) * 0.2;
    };
  });
  
  return textGroup;
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

// 创建欢迎广告牌
function createWelcomeBillboard(text) {
  const group = new THREE.Group();
  
  // 创建广告牌底座 - 3倍大小
  const baseGeometry = new THREE.BoxGeometry(15, 60, 6);
  const baseMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    roughness: 0.8,
    metalness: 0.2,
    bumpScale: 0.05
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, 30, 0); // 将底座一半埋在地下
  base.castShadow = true;
  base.receiveShadow = true;
  
  // 添加底座装饰
  const decorGeometry = new THREE.BoxGeometry(20, 5, 20);
  const decorMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x555555,
    roughness: 0.7,
    metalness: 0.3
  });
  const decor = new THREE.Mesh(decorGeometry, decorMaterial);
  decor.position.set(0, 2.5, 0);
  decor.castShadow = true;
  decor.receiveShadow = true;
  group.add(decor);
  
  // 创建广告牌板 - 3倍大小
  const boardGeometry = new THREE.BoxGeometry(180, 90, 6);
  const boardMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFFD700, // 金色底板
    shininess: 60,
    specular: 0x444444
  });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.set(0, 90, 0); // 放在底座上方
  board.castShadow = true;
  board.receiveShadow = true;
  
  // 创建正面文字纹理
  const frontTexture = createTextTexture(text, true);
  
  // 创建背面文字纹理 (相同文字)
  const backTexture = createTextTexture(text, false);
  
  // 创建正面文字平面 - 3倍大小
  const frontTextGeometry = new THREE.PlaneGeometry(174, 84);
  const frontTextMaterial = new THREE.MeshBasicMaterial({
    map: frontTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const frontTextMesh = new THREE.Mesh(frontTextGeometry, frontTextMaterial);
  frontTextMesh.position.set(0, 90, 3.5); // 增加与广告牌的距离以避免Z轴冲突
  
  // 创建背面文字平面 - 3倍大小
  const backTextGeometry = new THREE.PlaneGeometry(174, 84);
  const backTextMaterial = new THREE.MeshBasicMaterial({
    map: backTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const backTextMesh = new THREE.Mesh(backTextGeometry, backTextMaterial);
  backTextMesh.position.set(0, 90, -3.5); // 增加与广告牌的距离以避免Z轴冲突
  backTextMesh.rotation.y = Math.PI; // 翻转180度，使文字朝向背面
  
  // 添加静态发光装饰，替换动态光源
  const addLightBulb = (x, z) => {
    // 发光球体
    const bulbGeometry = new THREE.SphereGeometry(3, 16, 16);
    const bulbMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFFF99,
      emissive: 0xFFFF00,
      emissiveIntensity: 0.5
    });
    const lightBulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    lightBulb.position.set(x, 110, z);
    group.add(lightBulb);
    
    // 添加装饰底座
    const bulbBaseGeometry = new THREE.CylinderGeometry(2, 3, 4, 8);
    const bulbBaseMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
    const bulbBase = new THREE.Mesh(bulbBaseGeometry, bulbBaseMaterial);
    bulbBase.position.set(x, 106, z);
    group.add(bulbBase);
  };
  
  // 在四个角添加静态灯泡装饰
  addLightBulb(-85, 3.5);
  addLightBulb(85, 3.5);
  addLightBulb(-85, -3.5);
  addLightBulb(85, -3.5);
  
  // 将所有部件添加到组中
  group.add(base);
  group.add(board);
  group.add(frontTextMesh);
  group.add(backTextMesh);
  
  // 设置广告牌位置
  group.position.set(0, 0, -500); // 放在地面上，在初始视角前方
  
  return group;
}

// 创建文字纹理的辅助函数
function createTextTexture(text, isFront) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  
  // 创建渐变背景
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  if (isFront) {
    gradient.addColorStop(0, '#004422');  // 深绿色顶部
    gradient.addColorStop(1, '#003311');  // 更深的绿色底部
  } else {
    gradient.addColorStop(0, '#5C0000');  // 较亮的深红色顶部
    gradient.addColorStop(1, '#3C0000');  // 深红色底部
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // 添加纹理效果 - 轻微的噪点背景
  const addNoiseTexture = () => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // 添加少量随机变化但保持较小
      const noise = Math.random() * 10 - 5;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
      data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    context.putImageData(imageData, 0, 0);
  };
  addNoiseTexture();
  
  // 添加花纹边框
  context.strokeStyle = '#FFD700';
  context.lineWidth = 20;
  context.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
  
  // 绘制内部阴影
  context.shadowColor = '#000000';
  context.shadowBlur = 15;
  context.shadowOffsetX = 5;
  context.shadowOffsetY = 5;
  
  // 设置文字样式
  context.font = 'bold 200px Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // 绘制文字外发光效果
  context.strokeStyle = '#FFFFFF';
  context.lineWidth = 8;
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  
  // 绘制文字
  context.fillStyle = isFront ? '#FFFFFF' : '#FFD700';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // 添加底部小文字
  context.font = '80px Arial';
  context.fillStyle = '#CCCCCC';
  context.fillText(isFront ? '欢迎您的到来!' : 'Thank You For Visiting!', canvas.width / 2, canvas.height - 150);
  
  // 创建纹理
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
} 