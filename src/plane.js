import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createPlane() {
  // 创建飞机组
  const planeGroup = new THREE.Group();
  
  // 创建一个临时的简单模型作为占位符，直到GLB加载完成
  const tempBodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x33cc33, // 绿色占位符 - 鹦鹉颜色
    flatShading: true
  });
  
  const tempBodyGeometry = new THREE.BoxGeometry(3, 3, 5);
  const tempBody = new THREE.Mesh(tempBodyGeometry, tempBodyMaterial);
  tempBody.castShadow = true;
  tempBody.receiveShadow = true;
  planeGroup.add(tempBody);
  
  // 创建螺旋桨组 - 用于动画控制
  const propellerGroup = new THREE.Group();
  propellerGroup.position.z = -2;
  planeGroup.add(propellerGroup);
  
  console.log('开始加载鹦鹉模型...');
  
  // Three.js官方CDN路径
  const parrotUrl = 'https://threejs.org/examples/models/gltf/Parrot.glb';
  
  // 加载GLB模型
  const loader = new GLTFLoader();
  
  console.log(`尝试加载鹦鹉模型: ${parrotUrl}`);
  
  loader.load(parrotUrl, (gltf) => {
    console.log('鹦鹉模型加载成功!');
    
    // 从gltf场景中获取鹦鹉模型 - 关键修改：使用第一个子对象而不是整个场景
    const model = gltf.scene.children[0];
    
    // 使用类似于官方示例的缩放比例和位置
    const s = 0.35;
    model.scale.set(s, s, s);
    
    // 调整模型方向
    model.rotation.y = -1; // 使用与火烈鸟相同的旋转
    
    // 启用阴影
    model.castShadow = true;
    model.receiveShadow = true;
    
    // 不修改材质，保留原始颜色和纹理
    // 仅遍历模型以确保阴影设置正确
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    
    // 移除临时模型并添加加载的模型
    planeGroup.remove(tempBody);
    planeGroup.add(model);
    
    // 创建动画混合器
    if (gltf.animations && gltf.animations.length) {
      console.log(`模型包含 ${gltf.animations.length} 个动画`);
      
      const mixer = new THREE.AnimationMixer(model);
      
      // 使用与官方示例相同的动画播放方式
      mixer.clipAction(gltf.animations[0]).setDuration(1).play();
      
      // 将混合器添加到模型以便在主循环中更新
      model.userData.mixer = mixer;
    }
    
    console.log('鹦鹉模型加载完成');
  }, 
  (xhr) => {
    // 加载进度
    console.log(`模型加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
  },
  (error) => {
    console.error('加载鹦鹉模型时出错:', error);
    // 加载失败时，尝试第二个备选链接
    console.log('尝试备选CDN...');
    
    const backupUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Parrot.glb';
    
    loader.load(backupUrl, (gltf) => {
      console.log('从备选CDN加载鹦鹉模型成功!');
      
      // 从gltf场景中获取鹦鹉模型
      const model = gltf.scene.children[0];
      
      // 使用类似于官方示例的缩放比例和位置
      const s = 0.35;
      model.scale.set(s, s, s);
      
      // 调整模型方向
      model.rotation.y = -1;
      
      // 启用阴影
      model.castShadow = true;
      model.receiveShadow = true;
      
      // 移除临时模型并添加加载的模型
      planeGroup.remove(tempBody);
      planeGroup.add(model);
      
      // 创建动画混合器
      if (gltf.animations && gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).setDuration(1).play();
        model.userData.mixer = mixer;
      }
    }, null, (error) => {
      console.error('备选CDN也加载失败:', error);
    });
  });
  
  // 设置飞机组的初始位置
  planeGroup.position.y = 50;
  
  return {
    plane: planeGroup,
    propeller: propellerGroup
  };
} 