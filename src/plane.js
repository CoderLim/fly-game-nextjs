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
  
  // 创建螺旋桨组 - 对于鹦鹉模型，这将成为翅膀动画的控制器
  const propellerGroup = new THREE.Group();
  propellerGroup.position.z = -2;
  planeGroup.add(propellerGroup);
  
  console.log('开始加载鹦鹉模型...');
  
  // 添加一个自定义灯光提高模型可见度
  const modelLight = new THREE.PointLight(0xffffff, 2, 100);
  modelLight.position.set(0, 10, 0);
  planeGroup.add(modelLight);
  
  // Three.js官方CDN路径
  const parrotUrl = 'https://threejs.org/examples/models/gltf/Parrot.glb';
  
  // 加载GLB模型
  const loader = new GLTFLoader();
  
  console.log(`尝试加载鹦鹉模型: ${parrotUrl}`);
  
  loader.load(parrotUrl, (gltf) => {
    console.log('鹦鹉模型加载成功!');
    
    // 添加加载的模型到飞机组
    const model = gltf.scene;
    
    // 调整鹦鹉模型的比例 - 增大尺寸，使其更加明显
    model.scale.set(0.6, 0.6, 0.6);
    
    // 调整模型方向
    model.rotation.y = Math.PI; // 使鹦鹉面向前方
    
    // 为整个模型应用材质增强 - 保留原始纹理
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // 保留原始材质和纹理，只增强某些属性
        if (node.material) {
          // 检查是否有原始纹理
          const hasTexture = node.material.map !== null;
          
          // 如果是数组材质，处理每个子材质
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => {
              // 保留纹理但增强其他属性
              if (mat.map) {
                mat.roughness = 0.7;  // 调整粗糙度
                mat.metalness = 0.2;  // 调整金属度
                mat.envMapIntensity = 1.2; // 增强环境反射
              }
            });
          } else {
            // 保留原始纹理，只增强渲染属性
            const originalMaterial = node.material;
            
            // 创建新材质，保留原始纹理和颜色
            const enhancedMaterial = new THREE.MeshStandardMaterial({
              map: originalMaterial.map, // 保留原始纹理贴图
              color: originalMaterial.color ? originalMaterial.color.clone() : new THREE.Color(0xffffff),
              normalMap: originalMaterial.normalMap,
              roughnessMap: originalMaterial.roughnessMap,
              metalnessMap: originalMaterial.metalnessMap,
              alphaMap: originalMaterial.alphaMap,
              emissiveMap: originalMaterial.emissiveMap,
              
              // 增强属性
              roughness: 0.7,
              metalness: 0.2,
              emissive: new THREE.Color(0x222222),
              emissiveIntensity: 0.2
            });
            
            // 应用增强材质
            node.material = enhancedMaterial;
          }
          
          // 如果没有纹理，则给它一些有趣的颜色
          if (!hasTexture) {
            // 为不同部位使用不同的颜色
            const meshName = node.name.toLowerCase();
            
            // 根据网格名称调整颜色
            if (meshName.includes('body') || meshName.includes('torso')) {
              node.material.color.set(0x22cc88); // 绿色身体
            } else if (meshName.includes('wing')) {
              node.material.color.set(0x3377dd); // 蓝色翅膀
            } else if (meshName.includes('head')) {
              node.material.color.set(0xdd3322); // 红色头部
            } else if (meshName.includes('beak') || meshName.includes('bill')) {
              node.material.color.set(0xddaa22); // 黄色喙
            } else if (meshName.includes('leg') || meshName.includes('foot')) {
              node.material.color.set(0xaaaaaa); // 灰色腿
            } else {
              // 默认使用鲜艳的彩色
              node.material.color.set(0x44aaff);
            }
          }
        }
      }
    });
    
    // 添加自定义模型照明
    const frontLight = new THREE.SpotLight(0xffffff, 2);
    frontLight.position.set(0, 5, -10);
    frontLight.target = model;
    model.add(frontLight);
    
    const bottomLight = new THREE.SpotLight(0x88ccff, 1);
    bottomLight.position.set(0, -5, 0);
    bottomLight.target = model;
    model.add(bottomLight);
    
    // 移除临时模型并添加加载的模型
    planeGroup.remove(tempBody);
    planeGroup.add(model);
    
    // 为鹦鹉模型添加翅膀动画
    if (gltf.animations && gltf.animations.length) {
      console.log(`模型包含 ${gltf.animations.length} 个动画`);
      
      // 创建动画混合器
      const mixer = new THREE.AnimationMixer(model);
      
      // 遍历所有动画并播放
      gltf.animations.forEach((clip) => {
        console.log(`播放动画: ${clip.name}`);
        const action = mixer.clipAction(clip);
        action.play();
      });
      
      // 将混合器添加到模型以便在主循环中更新
      model.userData.mixer = mixer;
    }
    
    // 将模型位置调整得更自然
    model.position.y = 0;
    model.position.z = 0;
    
    console.log('鹦鹉模型渲染增强完成');
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
      const model = gltf.scene;
      model.scale.set(0.6, 0.6, 0.6);
      model.rotation.y = Math.PI;
      
      // 应用相同的材质增强和照明...
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          
          // 保留原始材质和纹理
          if (node.material) {
            // 保留纹理但增强材质属性
            if (node.material.map) {
              node.material.roughness = 0.7;
              node.material.metalness = 0.2;
              node.material.envMapIntensity = 1.2;
            }
          }
        }
      });
      
      planeGroup.remove(tempBody);
      planeGroup.add(model);
      
      if (gltf.animations && gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          action.play();
        });
        model.userData.mixer = mixer;
      }
    }, null, (error) => {
      console.error('备选CDN也加载失败:', error);
    });
  });
  
  // 设置飞机(鹦鹉)的初始位置
  planeGroup.position.y = 50;
  
  return {
    plane: planeGroup,
    propeller: propellerGroup
  };
} 