import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createHotAirBalloon, updateHotAirBalloon } from './hotAirBalloon.js';

// 初始化场景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 天空蓝色背景

// 初始化相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 20);

// 初始化渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 添加轨道控制器，可以旋转查看模型
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 添加灯光
// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// 方向光，模拟太阳光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// 添加坐标轴辅助
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// 创建热气球
const hotAirBalloon = createHotAirBalloon();
scene.add(hotAirBalloon);

// 处理窗口大小调整
window.addEventListener('resize', () => {
  // 更新相机宽高比
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // 更新渲染器大小
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  // 计算时间增量
  const deltaTime = clock.getDelta();
  
  // 更新热气球动画
  updateHotAirBalloon(hotAirBalloon, deltaTime);
  
  // 更新控制器
  controls.update();
  
  // 渲染场景
  renderer.render(scene, camera);
}

// 开始动画循环
animate(); 