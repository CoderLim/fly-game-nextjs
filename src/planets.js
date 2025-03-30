import * as THREE from 'three';

// 创建行星系统
export function createPlanets() {
  const planetsGroup = new THREE.Group();
  planetsGroup.name = "planets";
  
  // 添加星空背景
  const starfield = createStarfield();
  planetsGroup.add(starfield);
  
  // 添加土星
  const saturn = createSaturn();
  saturn.position.set(1500, 2000, -2000);
  saturn.scale.set(200, 200, 200);
  saturn.rotation.x = Math.PI / 6;
  planetsGroup.add(saturn);
  
  // 添加金星
  const venus = createVenus();
  venus.position.set(-1200, 2500, -1500);
  venus.scale.set(150, 150, 150);
  planetsGroup.add(venus);
  
  // 添加火星
  const mars = createMars();
  mars.position.set(800, 2200, -800);
  mars.scale.set(100, 100, 100);
  planetsGroup.add(mars);
  
  // 添加木星
  const jupiter = createJupiter();
  jupiter.position.set(-2000, 3000, -3000);
  jupiter.scale.set(300, 300, 300);
  jupiter.rotation.z = Math.PI / 12;
  planetsGroup.add(jupiter);
  
  // 添加行星之间的连线
  createPlanetaryLinks(planetsGroup);
  
  // 设置行星缓慢旋转的动画数据
  planetsGroup.children.forEach(planet => {
    if (planet.name === 'planetary-link' || planet.name === 'starfield') return; // 跳过连线和星空
    
    planet.userData.rotationSpeed = {
      x: (Math.random() - 0.5) * 0.0002,
      y: (Math.random() - 0.5) * 0.0002,
      z: (Math.random() - 0.5) * 0.0002
    };
  });
  
  return planetsGroup;
}

// 更新行星的旋转动画
export function updatePlanets(delta) {
  const planets = window.planets;
  if (!planets) return;
  
  planets.children.forEach(planet => {
    if (planet.userData.rotationSpeed) {
      if (planet.name === 'starfield') {
        // 星空背景的特殊旋转
        planet.rotation.y += planet.userData.rotationSpeed.y * delta;
      } else {
        // 行星的三轴旋转
        planet.rotation.x += planet.userData.rotationSpeed.x * delta;
        planet.rotation.y += planet.userData.rotationSpeed.y * delta;
        planet.rotation.z += planet.userData.rotationSpeed.z * delta;
      }
    }
  });
}

// 创建土星
function createSaturn() {
  const group = new THREE.Group();
  group.name = "saturn";
  
  // 土星本体
  const saturnGeometry = new THREE.SphereGeometry(1, 32, 32);
  const saturnMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0e080,
    roughness: 0.7,
    metalness: 0.1,
    emissive: 0x665500,
    emissiveIntensity: 0.2
  });
  
  const saturnMesh = new THREE.Mesh(saturnGeometry, saturnMaterial);
  group.add(saturnMesh);
  
  // 环的细节设置
  const ringCount = 3;
  const ringColors = [0xaa9966, 0xbbaa77, 0x997755];
  
  // 添加土星环
  for (let i = 0; i < ringCount; i++) {
    const innerRadius = 1.3 + i * 0.2;
    const outerRadius = 1.5 + i * 0.2;
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // 为环创建基础材质
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: ringColors[i],
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8 - i * 0.1
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }
  
  // 添加发光效果
  const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdd88,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);
  
  // 添加环的发光效果
  const ringGlowGeometry = new THREE.RingGeometry(1.3, 2.1, 64);
  const ringGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xddbb88,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide
  });
  
  const ringGlow = new THREE.Mesh(ringGlowGeometry, ringGlowMaterial);
  ringGlow.scale.set(1.1, 1.1, 1.1);
  ringGlow.rotation.x = Math.PI / 2;
  group.add(ringGlow);
  
  return group;
}

// 创建金星
function createVenus() {
  const group = new THREE.Group();
  group.name = "venus";
  
  // 金星本体
  const venusGeometry = new THREE.SphereGeometry(1, 32, 32);
  
  // 金星材质 - 偏黄白色，带有轻微的云层纹理
  const venusMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe6c0,
    roughness: 0.6,
    metalness: 0.2,
    emissive: 0x664400,
    emissiveIntensity: 0.3
  });
  
  const venusMesh = new THREE.Mesh(venusGeometry, venusMaterial);
  group.add(venusMesh);
  
  // 添加云层效果
  const cloudGeometry = new THREE.SphereGeometry(1.03, 32, 32);
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.4
  });
  
  const cloudLayer = new THREE.Mesh(cloudGeometry, cloudMaterial);
  group.add(cloudLayer);
  
  // 添加发光效果
  const glowGeometry = new THREE.SphereGeometry(1.1, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffee88,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide
  });
  
  const glowLayer = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glowLayer);
  
  return group;
}

// 创建火星
function createMars() {
  const group = new THREE.Group();
  group.name = "mars";
  
  // 火星本体
  const marsGeometry = new THREE.SphereGeometry(1, 32, 32);
  
  // 火星材质 - 红棕色
  const marsMaterial = new THREE.MeshStandardMaterial({
    color: 0xdd5533,
    roughness: 0.8,
    metalness: 0.1,
    emissive: 0x441100,
    emissiveIntensity: 0.1
  });
  
  const marsMesh = new THREE.Mesh(marsGeometry, marsMaterial);
  group.add(marsMesh);
  
  // 添加火星极冠
  const polarCapGeometry = new THREE.SphereGeometry(1.01, 32, 16, 0, Math.PI * 2, 0, Math.PI / 6);
  const polarCapMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.0
  });
  
  const northPolarCap = new THREE.Mesh(polarCapGeometry, polarCapMaterial);
  northPolarCap.rotation.x = Math.PI;
  group.add(northPolarCap);
  
  const southPolarCap = new THREE.Mesh(polarCapGeometry, polarCapMaterial);
  group.add(southPolarCap);
  
  return group;
}

// 创建木星
function createJupiter() {
  const group = new THREE.Group();
  group.name = "jupiter";
  
  // 木星本体
  const jupiterGeometry = new THREE.SphereGeometry(1, 32, 32);
  
  // 木星材质 - 条纹效果
  const jupiterMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeddaa,
    roughness: 0.7,
    metalness: 0.1,
    emissive: 0x554411,
    emissiveIntensity: 0.1
  });
  
  const jupiterMesh = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
  group.add(jupiterMesh);
  
  // 添加木星的条纹带
  const bandCount = 7;
  const bandWidths = [0.2, 0.15, 0.15, 0.1, 0.1, 0.15, 0.2];
  const bandColors = [
    0xddbb88, 0xeeddaa, 0xbb9977, 
    0xeeddaa, 0xbb9977, 0xeeddaa, 0xddbb88
  ];
  
  let currentY = -0.8;
  
  for (let i = 0; i < bandCount; i++) {
    const height = bandWidths[i];
    const bandGeometry = new THREE.CylinderGeometry(
      Math.sqrt(1 - currentY * currentY), // 上半径
      Math.sqrt(1 - (currentY + height) * (currentY + height)), // 下半径
      height, 32, 1, true
    );
    
    const bandMaterial = new THREE.MeshStandardMaterial({
      color: bandColors[i],
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.position.y = currentY + height/2;
    band.rotation.y = Math.random() * Math.PI * 2;
    
    currentY += height;
    group.add(band);
  }
  
  // 添加大红斑
  const spotGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const spotMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc4422,
    roughness: 0.7,
    metalness: 0.1
  });
  
  const spot = new THREE.Mesh(spotGeometry, spotMaterial);
  spot.position.set(0.9, 0.2, 0);
  group.add(spot);
  
  return group;
}

// 创建星际连线
function createPlanetaryLinks(planetsGroup) {
  const planets = planetsGroup.children.filter(child => 
    ['saturn', 'venus', 'mars', 'jupiter'].includes(child.name));
  
  // 为每个行星对创建连线
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];
      
      // 创建线条几何体
      const points = [];
      points.push(planet1.position.clone());
      points.push(planet2.position.clone());
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // 创建虚线材质
      const lineMaterial = new THREE.LineDashedMaterial({
        color: 0x88ccff,
        linewidth: 1,
        scale: 1,
        dashSize: 20,
        gapSize: 10,
        transparent: true,
        opacity: 0.3
      });
      
      const line = new THREE.Line(geometry, lineMaterial);
      line.name = 'planetary-link';
      line.computeLineDistances(); // 计算线段距离，用于虚线渲染
      
      planetsGroup.add(line);
    }
  }
  
  // 添加几条额外的装饰线
  for (let i = 0; i < 3; i++) {
    const startPoint = new THREE.Vector3(
      (Math.random() - 0.5) * 4000,
      2000 + Math.random() * 1000,
      (Math.random() - 0.5) * 4000
    );
    
    const endPoint = new THREE.Vector3(
      (Math.random() - 0.5) * 4000,
      2000 + Math.random() * 1000,
      (Math.random() - 0.5) * 4000
    );
    
    const points = [];
    points.push(startPoint);
    points.push(endPoint);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0x6699cc,
      linewidth: 1,
      scale: 1,
      dashSize: 15,
      gapSize: 8,
      transparent: true,
      opacity: 0.2
    });
    
    const line = new THREE.Line(geometry, lineMaterial);
    line.name = 'planetary-link';
    line.computeLineDistances();
    
    planetsGroup.add(line);
  }
}

// 创建星空背景
function createStarfield() {
  const group = new THREE.Group();
  group.name = "starfield";
  
  // 创建大量星星的几何体
  const starCount = 2000;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    
    // 在太空区域随机分布星星
    const radius = 5000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i3 + 1] = 1500 + Math.random() * 2000; // 高度在云层上方
    starPositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    
    // 随机星星颜色 - 主要是白色/蓝色/黄色系
    const colorChoice = Math.random();
    if (colorChoice < 0.7) {
      // 白色/蓝白色系
      starColors[i3] = 0.8 + Math.random() * 0.2;
      starColors[i3 + 1] = 0.8 + Math.random() * 0.2;
      starColors[i3 + 2] = 0.9 + Math.random() * 0.1;
    } else if (colorChoice < 0.9) {
      // 黄色/橙色系
      starColors[i3] = 0.9 + Math.random() * 0.1;
      starColors[i3 + 1] = 0.7 + Math.random() * 0.3;
      starColors[i3 + 2] = 0.4 + Math.random() * 0.3;
    } else {
      // 红色系
      starColors[i3] = 0.9 + Math.random() * 0.1;
      starColors[i3 + 1] = 0.2 + Math.random() * 0.4;
      starColors[i3 + 2] = 0.2 + Math.random() * 0.3;
    }
    
    // 随机星星大小
    starSizes[i] = Math.random() * 3 + 1;
  }
  
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
  
  // 使用顶点着色器材质创建星星
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      // 不使用外部纹理，改用内置的圆形点
      color: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        // 创建圆形点
        float r = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (r > 0.5) discard;
        
        // 渐变的发光效果
        float alpha = 1.0 - smoothstep(0.0, 0.5, r);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: true
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  group.add(stars);
  
  // 添加几个明亮的行星背景星
  const brightStarsCount = 30;
  const brightStarGeometry = new THREE.SphereGeometry(1, 8, 8);
  
  for (let i = 0; i < brightStarsCount; i++) {
    const brightStarMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(
        0.8 + Math.random() * 0.2,
        0.8 + Math.random() * 0.2,
        0.8 + Math.random() * 0.2
      ),
      transparent: true,
      opacity: 0.7 + Math.random() * 0.3
    });
    
    const star = new THREE.Mesh(brightStarGeometry, brightStarMaterial);
    
    // 随机位置
    const distance = 3000 + Math.random() * 2000;
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    
    star.position.set(
      Math.sin(angle1) * Math.cos(angle2) * distance,
      1800 + Math.random() * 1700,
      Math.sin(angle1) * Math.sin(angle2) * distance
    );
    
    // 随机大小
    const scale = 5 + Math.random() * 15;
    star.scale.set(scale, scale, scale);
    
    // 添加光晕
    const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(
        0.8 + Math.random() * 0.2,
        0.8 + Math.random() * 0.2,
        0.9 + Math.random() * 0.1
      ),
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    star.add(glow);
    
    group.add(star);
  }
  
  // 添加动画数据
  group.userData.rotationSpeed = {
    y: 0.0001
  };
  
  return group;
} 