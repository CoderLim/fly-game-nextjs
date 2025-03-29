import * as THREE from 'three';

export function createSky() {
  const skyGroup = new THREE.Group();
  
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
  skyGroup.add(sky);
  
  // 添加白云
  addClouds(skyGroup);
  
  return skyGroup;
}

// 创建云朵
function createCloud() {
  const cloudGroup = new THREE.Group();
  
  // 创建更逼真的云朵材质
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xaaaaaa,
    emissiveIntensity: 0.1,
    roughness: 0.9,
    metalness: 0.0,
    opacity: 0.85,
    transparent: true
  });
  
  // 添加更多球体，使云朵更自然
  const coreCount = 3 + Math.floor(Math.random() * 5); // 核心部分
  const detailCount = 8 + Math.floor(Math.random() * 10); // 更多细节球体
  
  // 创建云朵核心部分
  const cloudCoreSize = 50 + Math.random() * 60; // 减小核心尺寸
  for (let i = 0; i < coreCount; i++) {
    const scale = 0.6 + Math.random() * 0.4; // 核心球体大小变化
    const sphereRadius = cloudCoreSize * scale;
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 8);
    const sphereMesh = new THREE.Mesh(sphereGeometry, cloudMaterial);
    
    // 随机位置偏移，但保持相对集中
    const xOffset = (Math.random() - 0.5) * cloudCoreSize * 1.2;
    const yOffset = (Math.random() - 0.5) * cloudCoreSize * 0.3;
    const zOffset = (Math.random() - 0.5) * cloudCoreSize * 1.2;
    
    sphereMesh.position.set(xOffset, yOffset, zOffset);
    cloudGroup.add(sphereMesh);
  }
  
  // 添加更多的小球体，形成蓬松的边缘
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xaaaaaa,
    emissiveIntensity: 0.1,
    roughness: 0.9,
    metalness: 0.0,
    opacity: 0.6, // 边缘更透明
    transparent: true
  });
  
  for (let i = 0; i < detailCount; i++) {
    const sphereRadius = 10 + Math.random() * 40; // 小球体用于细节
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 6, 6);
    const sphereMesh = new THREE.Mesh(sphereGeometry, edgeMaterial);
    
    // 在核心周围随机分布
    const distance = cloudCoreSize * (0.8 + Math.random() * 0.6);
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    
    const xOffset = Math.sin(angle1) * Math.cos(angle2) * distance;
    const yOffset = Math.sin(angle1) * Math.sin(angle2) * distance * 0.4; // 垂直方向压缩
    const zOffset = Math.cos(angle1) * distance;
    
    sphereMesh.position.set(xOffset, yOffset, zOffset);
    cloudGroup.add(sphereMesh);
  }
  
  // 随机整体缩放 - 让云朵大小更多样化
  const cloudTypes = [
    { name: "小积云", scale: 0.4 + Math.random() * 0.3 },
    { name: "中积云", scale: 0.6 + Math.random() * 0.4 },
    { name: "大积云", scale: 0.9 + Math.random() * 0.5 }
  ];
  
  const selectedType = cloudTypes[Math.floor(Math.random() * cloudTypes.length)];
  const scale = selectedType.scale;
  cloudGroup.scale.set(scale, scale * 0.5, scale);
  cloudGroup.userData.type = selectedType.name;
  
  // 随机旋转云朵
  cloudGroup.rotation.y = Math.random() * Math.PI * 2;
  
  // 添加动画数据
  cloudGroup.userData.speed = 0.02 + Math.random() * 0.05; // 降低移动速度
  cloudGroup.userData.rotationSpeed = (Math.random() - 0.5) * 0.0005;
  cloudGroup.userData.direction = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
  
  return cloudGroup;
}

// 添加云朵到天空
function addClouds(skyGroup) {
  // 创建更多云朵，分为多层
  const layers = [
    { height: 300 + Math.random() * 200, count: 10 + Math.floor(Math.random() * 7), scale: 1.2 }, // 低层云
    { height: 700 + Math.random() * 300, count: 15 + Math.floor(Math.random() * 10), scale: 1.0 }, // 中层云
    { height: 1200 + Math.random() * 400, count: 8 + Math.floor(Math.random() * 6), scale: 0.8 }  // 高层云
  ];
  
  // 为每一层创建云朵
  layers.forEach(layer => {
    for (let i = 0; i < layer.count; i++) {
      const cloud = createCloud();
      
      // 按层调整缩放
      cloud.scale.multiplyScalar(layer.scale);
      
      // 在天空半球上随机放置云朵
      const radius = 3000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.35; // 减少在上半球的覆盖范围
      
      // 球坐标转笛卡尔坐标
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = layer.height + Math.random() * 200; // 按层高度分布，有小随机性
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      cloud.position.set(x, y, z);
      
      // 添加到云朵组
      skyGroup.add(cloud);
    }
  });
  
  // 注册全局更新函数
  if (typeof window !== 'undefined') {
    if (!window.cloudAnimations) {
      window.cloudAnimations = [];
      
      // 云朵动画更新函数
      window.updateClouds = function(delta) {
        if (!skyGroup) return;
        
        skyGroup.children.forEach(child => {
          if (child.userData && child.userData.speed) {
            // 移动云朵
            const moveVector = child.userData.direction.clone()
              .multiplyScalar(child.userData.speed * delta);
            child.position.add(moveVector);
            
            // 轻微旋转云朵
            child.rotation.y += child.userData.rotationSpeed * delta;
            
            // 如果云朵移动太远，重新放置到另一侧
            if (child.position.length() > 6000) {
              // 反向放置，确保云朵循环出现
              child.position.multiplyScalar(-0.8);
              // 随机化高度但保持在原来的层
              const originalY = child.position.y;
              child.position.y = originalY + Math.random() * 200 - 100;
            }
          }
        });
      };
      
      // 将更新函数添加到动画循环中
      const originalAnimate = window.animate;
      if (originalAnimate) {
        window.animate = function() {
          // 调用原始动画函数
          originalAnimate();
          
          // 更新云朵
          const delta = window.clock ? window.clock.getDelta() : 0.016;
          window.updateClouds(delta * 100);
        };
      }
    }
    
    // 添加这些云朵到跟踪数组
    window.cloudAnimations.push(skyGroup);
  }
} 