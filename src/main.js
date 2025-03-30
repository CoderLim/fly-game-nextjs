import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { createPlane } from './plane.js';
import { createBuildings } from './buildings.js';
import { createSky } from './sky.js';
import { createGround } from './ground.js';
import { createAirObjects, updateAirObjectsChunks, updateAirObjects, getCurrentWeather } from './airObjects.js';

// 地图生成相关常量
const CHUNK_SIZE = 500; // 区块大小
const RENDER_DISTANCE = 2; // 渲染距离（区块数）
const loadedChunks = new Map(); // 存储已加载的区块

// 初始化场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance",
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1; // 微调曝光度，减少过度曝光
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// 存储所有动画混合器
const mixers = [];

// 天空颜色
scene.background = new THREE.Color(0x87ceeb); // 设置更自然的天空蓝

// 添加半球光照明系统 - 模拟来自天空和地面的环境光
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.2);
hemisphereLight.color.setHSL(0.6, 1, 0.6); // 天空色 - 浅蓝色
hemisphereLight.groundColor.setHSL(0.095, 1, 0.75); // 地面色 - 绿色
hemisphereLight.position.set(0, 50, 0);
scene.add(hemisphereLight);

// 添加方向光，模拟太阳光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.color.setHSL(0.1, 1, 0.95); // 太阳色 - 微黄色
directionalLight.position.set(-1, 1.75, 1);
directionalLight.position.multiplyScalar(30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 4096;
directionalLight.shadow.mapSize.height = 4096;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 2000;
directionalLight.shadow.camera.left = -1000;
directionalLight.shadow.camera.right = 1000;
directionalLight.shadow.camera.top = 1000;
directionalLight.shadow.camera.bottom = -1000;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

// 添加更自然的地平线雾效，模拟大气透视
scene.fog = new THREE.FogExp2(0x99ccff, 0.0004);

// 添加飞机专用照明
const planeSpotLight = new THREE.SpotLight(0xffffff, 1);
planeSpotLight.position.set(0, 100, 0);
planeSpotLight.angle = Math.PI / 6;
planeSpotLight.penumbra = 0.2;
planeSpotLight.decay = 1;
planeSpotLight.distance = 500;
planeSpotLight.castShadow = true;
scene.add(planeSpotLight);

// 添加鹦鹉的环绕光，让鹦鹉在任何角度都能被看到
const planeRimLight1 = new THREE.PointLight(0x88ccff, 1, 100);
scene.add(planeRimLight1);

const planeRimLight2 = new THREE.PointLight(0xff9966, 1, 100);
scene.add(planeRimLight2);

// 天空
const sky = createSky();
scene.add(sky);

// 地面
const ground = createGround();
scene.add(ground);

// 在初始化场景时，添加空中物体
const airObjectsGroup = createAirObjects();
scene.add(airObjectsGroup);

// 首先加载LittlestTokyo模型，确保它有足够时间加载
console.log('准备加载LittlestTokyo模型...');
loadLittlestTokyoModel();

// 创建飞机
const { plane, propeller } = createPlane();
scene.add(plane);

// 设置相机初始位置
camera.position.set(0, 50, 200);
camera.lookAt(plane.position);

// 游戏状态
const gameState = {
  speed: 0,
  score: 0,
  acceleration: 25.0,  // 提高加速度，从5.0增加到25.0（原来的5倍）
  maxSpeed: 125,       // 提高最大速度，从25增加到125（原来的5倍）
  yawSpeed: 0.05,
  pitchSpeed: 0.05,
  altitude: 50,
  crashed: false,
  planeRotation: {
    x: 0,
    y: 0,
    z: 0
  }
};

// 帧率计算
let lastFrameTime = performance.now();

// 键盘控制状态
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false
};

// 监听键盘事件
window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.code)) {
    keys[e.code] = false;
  }
});

// 鼠标控制相关状态
const mouseControl = {
  isPressed: false,
  startX: 0,
  startY: 0,
  moveX: 0,
  moveY: 0,
  totalRotationX: 0, // 累计垂直旋转角度
  totalRotationY: 0, // 累计水平旋转角度
  returnSpeed: 0.1, // 视角回正的速度，增加以获得更快的回正效果
  sensitivityX: 0.003, // 水平灵敏度
  sensitivityY: 0.002  // 垂直灵敏度
};

// 添加拖动模式提示
function addDragModeUI() {
  const dragModeUI = document.createElement('div');
  dragModeUI.id = 'dragMode';
  dragModeUI.textContent = '拖动鼠标/触摸屏可以临时调整视角';
  dragModeUI.style.position = 'absolute';
  dragModeUI.style.bottom = '10px';
  dragModeUI.style.left = '50%';
  dragModeUI.style.transform = 'translateX(-50%)';
  dragModeUI.style.color = 'white';
  dragModeUI.style.fontSize = '14px';
  dragModeUI.style.padding = '5px 10px';
  dragModeUI.style.backgroundColor = 'rgba(0,0,0,0.5)';
  dragModeUI.style.borderRadius = '4px';
  dragModeUI.style.opacity = '0.7';
  dragModeUI.style.transition = 'opacity 0.3s';
  document.body.appendChild(dragModeUI);
  
  // 拖动状态提示
  const dragStateUI = document.createElement('div');
  dragStateUI.id = 'dragState';
  dragStateUI.textContent = '';
  dragStateUI.style.position = 'absolute';
  dragStateUI.style.top = '10px';
  dragStateUI.style.left = '50%';
  dragStateUI.style.transform = 'translateX(-50%)';
  dragStateUI.style.color = 'white';
  dragStateUI.style.fontSize = '16px';
  dragStateUI.style.fontWeight = 'bold';
  dragStateUI.style.padding = '5px 15px';
  dragStateUI.style.backgroundColor = 'rgba(255,165,0,0.7)';
  dragStateUI.style.borderRadius = '4px';
  dragStateUI.style.opacity = '0';
  dragStateUI.style.transition = 'opacity 0.3s';
  document.body.appendChild(dragStateUI);
  
  return { dragModeUI, dragStateUI };
}

// 在游戏初始化时调用
const { dragModeUI, dragStateUI } = addDragModeUI();

// 监听鼠标事件
document.addEventListener('mousedown', (e) => {
  // 只响应左键和右键
  if (e.button === 0 || e.button === 2) {
    mouseControl.isPressed = true;
    mouseControl.startX = e.clientX;
    mouseControl.startY = e.clientY;
    
    // 显示拖动状态提示
    dragStateUI.textContent = '视角调整中...';
    dragStateUI.style.opacity = '1';
  }
});

document.addEventListener('mousemove', (e) => {
  if (mouseControl.isPressed) {
    // 计算鼠标移动距离
    const moveX = e.clientX - mouseControl.startX;
    const moveY = e.clientY - mouseControl.startY;
    
    // 根据鼠标移动增加累计旋转角度
    mouseControl.totalRotationY += moveX * mouseControl.sensitivityX;
    mouseControl.totalRotationX += moveY * mouseControl.sensitivityY;
    
    // 限制垂直旋转角度范围，防止视角过度翻转
    mouseControl.totalRotationX = Math.max(Math.min(mouseControl.totalRotationX, Math.PI/4), -Math.PI/4);
    
    // 更新起始点，实现连续旋转
    mouseControl.startX = e.clientX;
    mouseControl.startY = e.clientY;
  }
});

document.addEventListener('mouseup', () => {
  if (mouseControl.isPressed) {
    mouseControl.isPressed = false;
    
    // 隐藏拖动状态提示
    dragStateUI.textContent = '正在回到默认视角...';
    setTimeout(() => {
      dragStateUI.style.opacity = '0';
    }, 1000);
  }
});

// 禁用右键菜单
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// 触摸设备支持
document.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    mouseControl.isPressed = true;
    mouseControl.startX = e.touches[0].clientX;
    mouseControl.startY = e.touches[0].clientY;
    
    // 显示拖动状态提示
    dragStateUI.textContent = '视角调整中...';
    dragStateUI.style.opacity = '1';
  }
});

document.addEventListener('touchmove', (e) => {
  if (mouseControl.isPressed && e.touches.length === 1) {
    // 防止页面滚动
    e.preventDefault();
    
    // 计算触摸移动距离
    const moveX = e.touches[0].clientX - mouseControl.startX;
    const moveY = e.touches[0].clientY - mouseControl.startY;
    
    // 根据触摸移动增加累计旋转角度
    mouseControl.totalRotationY += moveX * mouseControl.sensitivityX;
    mouseControl.totalRotationX += moveY * mouseControl.sensitivityY;
    
    // 限制垂直旋转角度范围，防止视角过度翻转
    mouseControl.totalRotationX = Math.max(Math.min(mouseControl.totalRotationX, Math.PI/4), -Math.PI/4);
    
    // 更新起始点，实现连续旋转
    mouseControl.startX = e.touches[0].clientX;
    mouseControl.startY = e.touches[0].clientY;
  }
}, { passive: false });

document.addEventListener('touchend', () => {
  if (mouseControl.isPressed) {
    mouseControl.isPressed = false;
    
    // 隐藏拖动状态提示
    dragStateUI.textContent = '正在回到默认视角...';
    setTimeout(() => {
      dragStateUI.style.opacity = '0';
    }, 1000);
  }
});

// 碰撞检测 - 阻止穿透而不是结束游戏
function detectCollisions() {
  // 保存上一帧的位置，用于碰撞后回退
  const previousPosition = new THREE.Vector3().copy(plane.position);
  const planePosition = plane.position.clone();
  let collision = false;
  
  // 检测与LittlestTokyo模型的碰撞
  if (window.tokyoModel) {
    const tokyoBoundingBox = new THREE.Box3().setFromObject(window.tokyoModel);
    const planeRadius = 5;
    
    if (planePosition.y < tokyoBoundingBox.max.y && 
        planePosition.distanceTo(window.tokyoModel.position) < 100) { // 使用适当的碰撞距离
      console.log('与LittlestTokyo碰撞');
      collision = true;
    }
  }
  
  // 检测与加载的所有区块中的建筑物的碰撞
  for (const chunk of Array.from(loadedChunks.values())) {
    if (collision) break; // 如果已经检测到碰撞，跳过剩余检测
    
    for (const object of chunk.children) {
      // 只检测与建筑物的碰撞（树木可以穿过）
      if (object.children && object.children.length > 0 && object.children[0].geometry && 
          object.children[0].geometry.type === 'BoxGeometry' && 
          object.children[0].geometry.parameters.height > 15) {
        
        const buildingBoundingBox = new THREE.Box3().setFromObject(object);
        
        // 飞机边界框（简化为一个点加上半径）
        const planeRadius = 5;
        if (planePosition.y < buildingBoundingBox.max.y && 
            planePosition.distanceTo(object.position) < object.scale.x * 10 + planeRadius) {
          console.log('与建筑物碰撞');
          collision = true;
          break;
        }
      }
    }
  }
  
  // 如果发生碰撞，回退到上一帧的位置并减速
  if (collision) {
    // 回退到上一帧的位置
    plane.position.copy(previousPosition);
    
    // 减少速度 - 模拟碰撞反弹
    gameState.speed = -gameState.speed * 0.5; // 反向并减半速度
    
    // 添加碰撞反馈 - 让相机轻微晃动
    camera.position.y += Math.random() * 2 - 1;
    camera.position.x += Math.random() * 2 - 1;
    
    // 播放碰撞音效 (假设有这样的功能)
    // playCollisionSound();
    
    return true;
  }
  
  return false;
}

// 更新飞机位置和旋转
function updatePlane(delta) {
  if (gameState.crashed) return;

  // 记住更新前的位置（用于碰撞检测）
  const previousPosition = plane.position.clone();
  
  // 前进/后退
  if (keys.ArrowUp) {
    gameState.speed = Math.min(gameState.speed + gameState.acceleration * delta * 5.0, gameState.maxSpeed);
  } else if (keys.ArrowDown) {
    gameState.speed = Math.max(gameState.speed - gameState.acceleration * delta * 5.0, -gameState.maxSpeed / 2);
  } else {
    // 没有按键时慢慢减速
    if (gameState.speed > 0) {
      gameState.speed = Math.max(gameState.speed - gameState.acceleration * delta / 4, 0);
    } else if (gameState.speed < 0) {
      gameState.speed = Math.min(gameState.speed + gameState.acceleration * delta / 4, 0);
    }
  }

  // 左右移动
  if (keys.ArrowLeft) {
    plane.position.x -= gameState.speed * delta * 3.0;
  }
  if (keys.ArrowRight) {
    plane.position.x += gameState.speed * delta * 3.0;
  }

  // 上升/下降
  if (keys.KeyW) {
    gameState.altitude += 15 * delta;
    gameState.planeRotation.x = -Math.PI / 10 * delta;
  } else if (keys.KeyS) {
    gameState.altitude -= 15 * delta;
    gameState.planeRotation.x = Math.PI / 10 * delta;
  } else {
    gameState.planeRotation.x = 0;
  }
  
  // 限制最低高度，避免撞地
  gameState.altitude = Math.max(gameState.altitude, 10);

  // 左右转向
  if (keys.KeyA) {
    gameState.planeRotation.y += gameState.yawSpeed * delta;
    gameState.planeRotation.z = Math.PI / 6 * delta;
  } else if (keys.KeyD) {
    gameState.planeRotation.y -= gameState.yawSpeed * delta;
    gameState.planeRotation.z = -Math.PI / 6 * delta;
  } else {
    gameState.planeRotation.z = 0;
  }

  // 应用旋转
  plane.rotation.x = gameState.planeRotation.x;
  plane.rotation.y = gameState.planeRotation.y;
  plane.rotation.z = gameState.planeRotation.z;

  // 更新飞机位置 - 确保方向向量是沿着z轴负方向
  const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), gameState.planeRotation.y);
  plane.position.addScaledVector(direction, gameState.speed * delta);
  plane.position.y = gameState.altitude;

  // 更新螺旋桨旋转
  if (propeller) {
    propeller.rotation.z += 0.2 + gameState.speed * 0.1 * delta;
  }

  // 若飞得足够远，增加分数
  gameState.score += Math.abs(gameState.speed) * 0.1 * delta;
  document.getElementById('score').innerText = `Score: ${Math.floor(gameState.score)}`;

  // 更新区块加载
  updateChunks();

  // 检测碰撞 - 如果发生碰撞，可能会回退位置
  detectCollisions();
}

// 区块坐标转换函数
function getChunkCoord(position) {
  return Math.floor(position / CHUNK_SIZE);
}

// 加载区块
function loadChunk(chunkX, chunkZ) {
  const chunkKey = `${chunkX},${chunkZ}`;
  
  // 检查区块是否已加载
  if (loadedChunks.has(chunkKey)) {
    return;
  }
  
  // 创建新区块
  const chunk = new THREE.Group();
  
  // 创建建筑
  const buildingCount = Math.floor(Math.random() * 3); // 每个区块0-2个建筑，减少为原来的1/10
  
  for (let i = 0; i < buildingCount; i++) {
    // 随机建筑物尺寸
    const width = 10 + Math.random() * 20;
    const height = 20 + Math.random() * 180; // 摩天大楼，高度从20到200不等
    const depth = 10 + Math.random() * 20;
    
    // 随机位置（在区块内）
    const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const z = chunkZ * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    
    // 创建建筑物
    const building = createBuildingWithWindows(width, height, depth);
    building.position.set(x, 0, z);
    
    // 随机旋转
    building.rotation.y = Math.random() * Math.PI * 2;
    
    chunk.add(building);
  }
  
  // 创建树木
  const treeCount = 10 + Math.floor(Math.random() * 30); // 每个区块10-40棵树
  
  for (let i = 0; i < treeCount; i++) {
    // 创建树木
    const treeType = Math.random() < 0.7 ? 'normal' : (Math.random() < 0.5 ? 'pine' : 'palm');
    const tree = createTree(treeType);
    
    // 随机位置（在区块内）
    const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    const z = chunkZ * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
    
    // 随机大小
    const scale = 0.5 + Math.random() * 1.5;
    tree.scale.set(scale, scale, scale);
    
    tree.position.set(x, 0, z);
    chunk.add(tree);
  }
  
  // 将区块添加到场景
  scene.add(chunk);
  
  // 记录已加载区块
  loadedChunks.set(chunkKey, chunk);
}

// 卸载区块
function unloadChunk(chunkX, chunkZ) {
  const chunkKey = `${chunkX},${chunkZ}`;
  
  if (loadedChunks.has(chunkKey)) {
    const chunk = loadedChunks.get(chunkKey);
    scene.remove(chunk);
    loadedChunks.delete(chunkKey);
  }
}

// 更新区块加载
function updateChunks() {
  const playerChunkX = getChunkCoord(plane.position.x);
  const playerChunkZ = getChunkCoord(plane.position.z);
  
  // 加载玩家周围的区块
  for (let x = playerChunkX - RENDER_DISTANCE; x <= playerChunkX + RENDER_DISTANCE; x++) {
    for (let z = playerChunkZ - RENDER_DISTANCE; z <= playerChunkZ + RENDER_DISTANCE; z++) {
      loadChunk(x, z);
    }
  }
  
  // 卸载距离玩家较远的区块
  for (const chunkKey of Array.from(loadedChunks.keys())) {
    const [chunkX, chunkZ] = chunkKey.split(',').map(Number);
    
    if (
      chunkX < playerChunkX - RENDER_DISTANCE - 1 ||
      chunkX > playerChunkX + RENDER_DISTANCE + 1 ||
      chunkZ < playerChunkZ - RENDER_DISTANCE - 1 ||
      chunkZ > playerChunkZ + RENDER_DISTANCE + 1
    ) {
      unloadChunk(chunkX, chunkZ);
    }
  }
}

// 创建树木
function createTree(type = 'normal') {
  const treeGroup = new THREE.Group();
  
  // 基于类型创建不同形状的树
  switch(type) {
    case 'pine': // 松树
      // 树干
      const pineTrunkGeometry = new THREE.CylinderGeometry(1, 1.5, 15, 8);
      const pineTrunkMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        flatShading: true
      });
      const pineTrunk = new THREE.Mesh(pineTrunkGeometry, pineTrunkMaterial);
      pineTrunk.castShadow = true;
      pineTrunk.position.y = 7.5;
      treeGroup.add(pineTrunk);
      
      // 树冠 - 多层圆锥形
      const pineColors = [0x006400, 0x228B22, 0x308014];
      const pineColor = pineColors[Math.floor(Math.random() * pineColors.length)];
      const pineMaterial = new THREE.MeshPhongMaterial({
        color: pineColor,
        flatShading: true
      });
      
      // 叠加的4层树冠
      for (let i = 0; i < 4; i++) {
        const height = 6 - i * 0.5;
        const radius = 5 - i * 0.7;
        const posY = 10 + i * 3;
        
        const pineTopGeometry = new THREE.ConeGeometry(radius, height, 8);
        const pineTop = new THREE.Mesh(pineTopGeometry, pineMaterial);
        pineTop.position.y = posY;
        pineTop.castShadow = true;
        treeGroup.add(pineTop);
      }
      break;
      
    case 'palm': // 棕榈树
      // 树干
      const palmTrunkGeometry = new THREE.CylinderGeometry(0.6, 1, 15, 8);
      const palmTrunkMaterial = new THREE.MeshPhongMaterial({
        color: 0xA0522D,
        flatShading: true
      });
      
      const palmTrunk = new THREE.Mesh(palmTrunkGeometry, palmTrunkMaterial);
      palmTrunk.castShadow = true;
      palmTrunk.position.y = 7.5;
      treeGroup.add(palmTrunk);
      
      // 棕榈叶
      const leafCount = 5 + Math.floor(Math.random() * 4);
      const leafMaterial = new THREE.MeshPhongMaterial({
        color: 0x4CA64C,
        flatShading: true,
        side: THREE.DoubleSide
      });
      
      for (let i = 0; i < leafCount; i++) {
        const leafGeometry = new THREE.ConeGeometry(0.5, 8, 4, 1, true);
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // 平面化叶子
        leaf.scale.y = 0.2;
        leaf.scale.x = 2;
        
        // 围绕树干顶部放置叶子
        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.set(
          Math.sin(angle) * 1.5,
          15,
          Math.cos(angle) * 1.5
        );
        
        // 使叶子向外倾斜
        leaf.rotation.x = Math.PI / 2;
        leaf.rotation.z = angle + Math.PI / 2;
        
        leaf.castShadow = true;
        treeGroup.add(leaf);
      }
      break;
      
    default: // 普通树
      // 树干
      const trunkGeometry = new THREE.CylinderGeometry(1, 1.5, 10, 8);
      const trunkMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        flatShading: true
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.position.y = 5;
      treeGroup.add(trunk);
      
      // 树冠
      const topGeometry = new THREE.SphereGeometry(5, 8, 8);
      const topMaterial = new THREE.MeshPhongMaterial({
        color: 0x228B22,
        flatShading: true
      });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 12;
      top.castShadow = true;
      treeGroup.add(top);
  }
  
  return treeGroup;
}

// 创建建筑
function createBuildingWithWindows(width, height, depth) {
  const buildingGroup = new THREE.Group();
  
  // 建筑物材质 - 使用更丰富的颜色组合
  const buildingMaterials = [
    new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true }), // 灰色
    new THREE.MeshPhongMaterial({ color: 0x333344, flatShading: true }), // 深蓝灰色
    new THREE.MeshPhongMaterial({ color: 0x445566, flatShading: true }), // 蓝灰色
    new THREE.MeshPhongMaterial({ color: 0x225577, flatShading: true }), // 蓝色
    new THREE.MeshPhongMaterial({ color: 0x664433, flatShading: true }), // 棕色
    new THREE.MeshPhongMaterial({ color: 0x335544, flatShading: true }), // 绿灰色
  ];
  
  // 窗户材质 - 更暖的光线效果
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffcc,
    emissive: 0xaa8866,
    emissiveIntensity: 0.5,
    flatShading: true
  });
  
  // 主体
  const mainBuildingGeometry = new THREE.BoxGeometry(width, height, depth);
  const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
  const mainBuilding = new THREE.Mesh(mainBuildingGeometry, material);
  mainBuilding.castShadow = true;
  mainBuilding.receiveShadow = true;
  buildingGroup.add(mainBuilding);
  
  // 添加窗户 - 调整窗户大小和间距
  const windowSize = 1.8;
  const windowSpacing = 4;
  
  // 计算每一面的窗户数量
  const windowsX = Math.floor(width / windowSpacing) - 1;
  const windowsY = Math.floor(height / windowSpacing) - 1;
  const windowsZ = Math.floor(depth / windowSpacing) - 1;
  
  const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.5);
  
  // 随机决定一些窗户是否亮着 - 增加更多亮着的窗户
  const windowChance = 0.8; // 80%的窗户是亮的
  
  // 在x轴方向的两个面添加窗户
  for (let y = 0; y < windowsY; y++) {
    for (let z = 0; z < windowsZ; z++) {
      if (Math.random() < windowChance) {
        // 前面
        const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow.position.set(-width/2 - 0.1, 
                                -height/2 + y * windowSpacing + windowSpacing, 
                                -depth/2 + z * windowSpacing + windowSpacing);
        buildingGroup.add(frontWindow);
      }
      
      if (Math.random() < windowChance) {
        // 后面
        const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        backWindow.position.set(width/2 + 0.1,
                              -height/2 + y * windowSpacing + windowSpacing,
                              -depth/2 + z * windowSpacing + windowSpacing);
        backWindow.rotation.y = Math.PI;
        buildingGroup.add(backWindow);
      }
    }
  }
  
  // 在z轴方向的两个面添加窗户
  for (let y = 0; y < windowsY; y++) {
    for (let x = 0; x < windowsX; x++) {
      if (Math.random() < windowChance) {
        // 左面
        const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        leftWindow.position.set(-width/2 + x * windowSpacing + windowSpacing,
                               -height/2 + y * windowSpacing + windowSpacing,
                               -depth/2 - 0.1);
        leftWindow.rotation.y = Math.PI / 2;
        buildingGroup.add(leftWindow);
      }
      
      if (Math.random() < windowChance) {
        // 右面
        const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        rightWindow.position.set(-width/2 + x * windowSpacing + windowSpacing,
                                -height/2 + y * windowSpacing + windowSpacing,
                                depth/2 + 0.1);
        rightWindow.rotation.y = -Math.PI / 2;
        buildingGroup.add(rightWindow);
      }
    }
  }
  
  // 将组进行平移，使建筑物底部位于y=0的平面上
  buildingGroup.position.y = height / 2;
  
  return buildingGroup;
}

// 游戏结束 - 保留但永远不会被调用
function gameOver() {
  // 游戏结束功能已被禁用
  console.log('游戏结束功能已被禁用');
}

// 更新相机位置
function updateCamera(delta) {
  // 设置相机位置靠近飞机
  const cameraOffset = new THREE.Vector3(0, 30, 100);
  
  // 如果鼠标被按下或总旋转角度不为零
  if (mouseControl.isPressed || Math.abs(mouseControl.totalRotationX) > 0.001 || Math.abs(mouseControl.totalRotationY) > 0.001) {
    // 创建旋转矩阵
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(mouseControl.totalRotationY * delta);
    
    // 应用旋转到基础偏移向量
    const rotatedOffset = cameraOffset.clone().applyMatrix4(rotationMatrix);
    
    // 添加垂直旋转
    rotatedOffset.y += 30 * Math.sin(mouseControl.totalRotationX * delta);
    rotatedOffset.z += 30 * Math.sin(mouseControl.totalRotationX * delta);
    
    // 只有在鼠标释放后才回到默认视角
    if (!mouseControl.isPressed) {
      mouseControl.totalRotationX *= (1 - mouseControl.returnSpeed);
      mouseControl.totalRotationY *= (1 - mouseControl.returnSpeed);
    }
    
    // 计算新的相机位置
    const cameraPosition = new THREE.Vector3().copy(plane.position).add(rotatedOffset);
    camera.position.lerp(cameraPosition, 0.2);
  } else {
    // 默认跟随视角
    const cameraPosition = new THREE.Vector3().copy(plane.position).add(cameraOffset);
    camera.position.lerp(cameraPosition, 0.2);
  }
  
  // 添加轻微的相机倾斜和抖动，使视觉效果更自然
  const time = Date.now() * 0.0003;
  const cameraShakeAmount = 0.1; // 减少抖动量
  camera.position.y += Math.sin(time * 1.5) * cameraShakeAmount;
  camera.position.x += Math.sin(time * 2) * cameraShakeAmount;
  
  // 更新飞机专用灯光位置
  planeSpotLight.position.copy(camera.position);
  planeSpotLight.target = plane;
  
  // 更新环绕光位置 - 更靠近鹦鹉
  planeRimLight1.position.copy(plane.position).add(new THREE.Vector3(10, 2, 0));
  planeRimLight2.position.copy(plane.position).add(new THREE.Vector3(-10, 2, 0));
  
  // 相机始终看向飞机
  camera.lookAt(plane.position);
}

// 动画循环
let clock = new THREE.Clock(); // 添加时钟来处理动画

function animate() {
  requestAnimationFrame(animate);
  
  // 计算帧率
  const now = performance.now();
  const delta = (now - lastFrameTime) / 1000; // 转换为秒
  lastFrameTime = now;
  
  // 更新所有动画混合器
  mixers.forEach(mixer => mixer.update(delta));
  
  // 更新鹦鹉模型动画
  if (plane && plane.children) {
    plane.children.forEach(child => {
      if (child.userData && child.userData.mixer) {
        child.userData.mixer.update(delta);
      }
    });
  }
  
  // 更新场景中其他对象的动画（如LittlestTokyo）
  scene.traverse((object) => {
    if (object.userData && object.userData.mixer && !mixers.includes(object.userData.mixer)) {
      object.userData.mixer.update(delta);
    }
  });
  
  // 更新云朵动画
  if (window.updateClouds) {
    window.updateClouds(delta * 100);
  }
  
  // 更新飞机
  updatePlane(delta);
  
  // 更新碰撞检测
  detectCollisions();
  
  // 更新摄像机
  updateCamera(delta);
  
  // 更新区块
  updateChunks();
  
  // 更新空中物体并检查是否需要加载/卸载新的空中物体区块
  updateAirObjectsChunks(plane.position);
  updateAirObjects(delta);
  
  // 渲染场景
  renderer.render(scene, camera);
}

// 窗口大小调整
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
});

// 初始化区块加载
updateChunks();

animate();

// 添加LittlestTokyo大型地标模型
function loadLittlestTokyoModel() {
  console.log('=== 开始加载LittlestTokyo模型 ===');
  console.log('当前工作目录: ' + window.location.href);

  // 设置Draco加载器
  const dracoLoader = new DRACOLoader();
  console.log('初始化DracoLoader...');
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  
  // 配置GLTF加载器使用Draco加载器
  const loader = new GLTFLoader();
  console.log('设置DracoLoader到GLTFLoader...');
  loader.setDRACOLoader(dracoLoader);
  
  // 尝试多个路径以确保能找到模型
  const localPath = '/models/gltf/LittlestTokyo.glb';
  const publicPath = '/LittlestTokyo.glb';
  const cdnPath = 'https://threejs.org/examples/models/gltf/LittlestTokyo.glb';
  const jsDelivrPath = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/LittlestTokyo.glb';
  
  console.log('尝试加载路径 (按顺序): ', localPath, publicPath, cdnPath, jsDelivrPath);
  
  // 尝试所有路径
  tryLoadModel(0);
  
  function tryLoadModel(pathIndex) {
    const paths = [localPath, publicPath, cdnPath, jsDelivrPath];
    if (pathIndex >= paths.length) {
      console.error('所有路径尝试失败...');
      return;
    }
    
    const currentPath = paths[pathIndex];
    console.log(`正在尝试加载路径(${pathIndex+1}/${paths.length}): ${currentPath}`);
    
    loader.load(currentPath, 
      // 加载成功
      function(gltf) {
        console.log(`从路径成功加载: ${currentPath}`);
        console.log('gltf对象内容: ', Object.keys(gltf));
        console.log('scene对象内容: ', gltf.scene);
        console.log('动画数量: ', gltf.animations ? gltf.animations.length : 0);
        
        // 获取模型
        const model = gltf.scene;
        
        // 使用合适的位置和缩放 - 移到更明显的位置，但缩小尺寸
        model.position.set(200, 30, -100); // 将模型移到右侧，不挡住鹦鹉路
        model.scale.set(0.25, 0.25, 0.25); // 调整为原来的一半大小（0.5→0.25）
        
        // 旋转模型使其面向玩家
        model.rotation.y = Math.PI;
        
        // 添加到文档window对象便于调试
        window.tokyoModel = model;
        window.gltfObject = gltf;
        
        console.log('模型设置完成:');
        console.log('- 位置:', model.position);
        console.log('- 缩放:', model.scale);
        console.log('- 旋转:', model.rotation);
        
        // 设置阴影
        let meshCount = 0;
        model.traverse(function(node) {
          if (node.isMesh) {
            meshCount++;
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        console.log(`模型中包含${meshCount}个网格对象`);
        
        // 创建动画混合器并播放动画
        if (gltf.animations && gltf.animations.length) {
          console.log(`动画详情:`, gltf.animations.map(a => a.name || 'unnamed'));
          
          const mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
          
          // 将mixer添加到全局mixers数组中以便更新
          mixers.push(mixer);
          console.log('动画混合器已创建并添加到更新列表');
        }
        
        // 将模型添加到场景
        scene.add(model);
        console.log('模型已添加到场景');
        
        // 记录模型尺寸和位置便于调试
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        console.log('模型尺寸:', size);
        console.log('模型边界框:', box.min, box.max);
        
        // 移除辅助边界框、标记球和指示线
        // const boxHelper = new THREE.Box3Helper(box, 0xff0000);
        // scene.add(boxHelper);
        // console.log('已添加红色边界框辅助对象');
        
        // const marker = new THREE.Mesh(
        //   new THREE.SphereGeometry(10, 16, 16),
        //   new THREE.MeshBasicMaterial({ color: 0xff0000 })
        // );
        // marker.position.copy(model.position);
        // marker.position.y += 100;
        
        // const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        // const points = [];
        // points.push(new THREE.Vector3(model.position.x, model.position.y + 200, model.position.z));
        // points.push(new THREE.Vector3(model.position.x, model.position.y, model.position.z));
        // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        // const line = new THREE.Line(lineGeometry, lineMaterial);
        
        // scene.add(marker);
        // scene.add(line);
        // console.log('已添加红色标记球和指示线');
      }, 
      // 加载进度
      function(xhr) {
        if (xhr.lengthComputable) {
          const percentComplete = xhr.loaded / xhr.total * 100;
          console.log(`加载进度 (${currentPath}): ${percentComplete.toFixed(2)}%`);
        } else {
          console.log(`加载中... 已加载 ${xhr.loaded} 字节`);
        }
      }, 
      // 加载错误
      function(error) {
        console.error(`路径 ${currentPath} 加载失败:`, error);
        console.log(`尝试下一个路径 (${pathIndex+1} -> ${pathIndex+2})`);
        // 尝试下一个路径
        tryLoadModel(pathIndex + 1);
      }
    );
  }
} 