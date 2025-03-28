import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createPlane } from './plane.js';
import { createBuildings } from './buildings.js';
import { createSky } from './sky.js';
import { createGround } from './ground.js';

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

// 创建建筑群
const buildings = createBuildings();
scene.add(buildings);

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

  // 检测碰撞
  detectCollisions();
}

// 碰撞检测
function detectCollisions() {
  // 简单碰撞检测 - 根据飞机位置和建筑物位置检测碰撞
  // 这里使用的是简化的检测，实际游戏可能需要更精确的碰撞检测
  const planePosition = plane.position.clone();
  const buildingsMesh = buildings.children;
  
  for (let building of buildingsMesh) {
    const buildingBoundingBox = new THREE.Box3().setFromObject(building);
    
    // 飞机边界框（简化为一个点加上半径）
    const planeRadius = 5;
    if (planePosition.y < buildingBoundingBox.max.y && 
        planePosition.distanceTo(building.position) < building.scale.x * 10 + planeRadius) {
      gameOver();
      break;
    }
  }

  // 检测是否超出游戏区域
  if (Math.abs(planePosition.x) > 1000 || Math.abs(planePosition.z) > 1000) {
    // 回到游戏区域中央
    plane.position.x = 0;
    plane.position.z = 0;
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
  const cameraOffset = new THREE.Vector3(0, 30, 100);
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

animate(); 