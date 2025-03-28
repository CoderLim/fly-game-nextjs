import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createPlane } from './plane.js';
import { createBuildings } from './buildings.js';
import { createSky } from './sky.js';
import { createGround } from './ground.js';

// 地图生成相关常量
const CHUNK_SIZE = 500; // 区块大小
const RENDER_DISTANCE = 2; // 渲染距离（区块数）
const loadedChunks = new Map(); // 存储已加载的区块

// 初始化场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 添加环境光和平行光
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(100, 500, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 2000;
directionalLight.shadow.camera.left = -1000;
directionalLight.shadow.camera.right = 1000;
directionalLight.shadow.camera.top = 1000;
directionalLight.shadow.camera.bottom = -1000;
scene.add(directionalLight);

// 天空
const sky = createSky();
scene.add(sky);

// 地面
const ground = createGround();
scene.add(ground);

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
  acceleration: 0.1,
  maxSpeed: 5,
  yawSpeed: 0.02,
  pitchSpeed: 0.02,
  altitude: 50,
  crashed: false,
  planeRotation: {
    x: 0,
    y: 0,
    z: 0
  }
};

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

// 更新飞机位置和旋转
function updatePlane() {
  if (gameState.crashed) return;

  // 前进/后退
  if (keys.ArrowUp) {
    gameState.speed = Math.min(gameState.speed + gameState.acceleration, gameState.maxSpeed);
  } else if (keys.ArrowDown) {
    gameState.speed = Math.max(gameState.speed - gameState.acceleration, -gameState.maxSpeed / 2);
  } else {
    // 没有按键时慢慢减速
    if (gameState.speed > 0) {
      gameState.speed = Math.max(gameState.speed - gameState.acceleration / 2, 0);
    } else if (gameState.speed < 0) {
      gameState.speed = Math.min(gameState.speed + gameState.acceleration / 2, 0);
    }
  }

  // 左右移动
  if (keys.ArrowLeft) {
    plane.position.x -= gameState.speed / 2;
  }
  if (keys.ArrowRight) {
    plane.position.x += gameState.speed / 2;
  }

  // 上升/下降
  if (keys.KeyW) {
    gameState.altitude += 1;
    gameState.planeRotation.x = -Math.PI / 12; // 上仰
  } else if (keys.KeyS) {
    gameState.altitude -= 1;
    gameState.planeRotation.x = Math.PI / 12; // 下俯
  } else {
    gameState.planeRotation.x = 0; // 恢复平衡
  }
  
  // 限制最低高度，避免撞地
  gameState.altitude = Math.max(gameState.altitude, 10);

  // 左右转向
  if (keys.KeyA) {
    gameState.planeRotation.y += gameState.yawSpeed;
    gameState.planeRotation.z = Math.PI / 8; // 向左倾斜
  } else if (keys.KeyD) {
    gameState.planeRotation.y -= gameState.yawSpeed;
    gameState.planeRotation.z = -Math.PI / 8; // 向右倾斜
  } else {
    gameState.planeRotation.z = 0; // 恢复平衡
  }

  // 应用旋转
  plane.rotation.x = gameState.planeRotation.x;
  plane.rotation.y = gameState.planeRotation.y;
  plane.rotation.z = gameState.planeRotation.z;

  // 更新飞机位置
  const direction = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), gameState.planeRotation.y);
  plane.position.addScaledVector(direction, gameState.speed);
  plane.position.y = gameState.altitude;

  // 更新螺旋桨旋转
  propeller.rotation.z += 0.2 + gameState.speed * 0.1;

  // 若飞得足够远，增加分数
  gameState.score += Math.abs(gameState.speed) * 0.1;
  document.getElementById('score').innerText = `Score: ${Math.floor(gameState.score)}`;

  // 更新区块加载
  updateChunks();

  // 检测碰撞
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
  const buildingCount = 5 + Math.floor(Math.random() * 15); // 每个区块5-20个建筑
  
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
  
  // 建筑物材质
  const buildingMaterials = [
    new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true }), // 灰色
    new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true }), // 深灰色
    new THREE.MeshPhongMaterial({ color: 0x666666, flatShading: true }), // 浅灰色
    new THREE.MeshPhongMaterial({ color: 0x225577, flatShading: true }), // 蓝灰色
    new THREE.MeshPhongMaterial({ color: 0x775522, flatShading: true }), // 棕色
  ];
  
  // 窗户材质
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffcc,
    emissive: 0x444444,
    flatShading: true
  });
  
  // 主体
  const mainBuildingGeometry = new THREE.BoxGeometry(width, height, depth);
  const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
  const mainBuilding = new THREE.Mesh(mainBuildingGeometry, material);
  mainBuilding.castShadow = true;
  mainBuilding.receiveShadow = true;
  buildingGroup.add(mainBuilding);
  
  // 添加窗户
  const windowSize = 2;
  const windowSpacing = 5;
  
  // 计算每一面的窗户数量
  const windowsX = Math.floor(width / windowSpacing) - 1;
  const windowsY = Math.floor(height / windowSpacing) - 1;
  const windowsZ = Math.floor(depth / windowSpacing) - 1;
  
  const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.5);
  
  // 随机决定一些窗户是否亮着
  const windowChance = 0.7; // 70%的窗户是亮的
  
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

// 碰撞检测
function detectCollisions() {
  // 简单碰撞检测 - 根据飞机位置和建筑物位置检测碰撞
  const planePosition = plane.position.clone();
  
  // 检测与加载的所有区块中的建筑物的碰撞
  for (const chunk of Array.from(loadedChunks.values())) {
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
          gameOver();
          break;
        }
      }
    }
  }
}

// 游戏结束
function gameOver() {
  gameState.crashed = true;
  document.getElementById('info').innerText = '游戏结束! 刷新页面重新开始';
  document.getElementById('info').style.color = 'red';
  document.getElementById('info').style.fontSize = '24px';
}

// 更新相机位置
function updateCamera() {
  // 第三人称视角，相机跟随飞机
  const cameraOffset = new THREE.Vector3(0, 35, 80); // 提高相机位置，Y轴从15增加到35
  const cameraPosition = plane.position.clone().add(cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), plane.rotation.y));
  
  camera.position.copy(cameraPosition);
  camera.lookAt(plane.position);
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  
  updatePlane();
  updateCamera();
  
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